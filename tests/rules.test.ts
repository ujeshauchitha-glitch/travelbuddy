// Security-rules tests. Run with `npm run test:rules` (needs Java for the Firestore emulator).
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { eraseUserData } from '../src/lib/deleteAccount'

let env: RulesTestEnvironment

const ctx = (uid: string, email = `${uid}@vitstudent.ac.in`, verified = true) =>
  env.authenticatedContext(uid, { email, email_verified: verified }).firestore()

const future = () => Timestamp.fromMillis(Date.now() + 86_400_000)
const trip = (hostId: string, audience: string) => ({
  hostId, hostName: hostId, mode: 'cab', origin: { name: 'A' }, destination: { name: 'B' },
  departAt: future(), spotsOpen: 2, luggageFriendly: true, audience, memberIds: [hostId], createdAt: serverTimestamp(),
})

// Seed documents bypassing rules.
async function seedUser(uid: string, gender: string, vis: Record<string, string> = {}) {
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore()
    await setDoc(doc(db, 'profiles', uid), {
      displayName: uid,
      contactVisibility: { phone: 'travelmates', email: 'me', instagram: 'travelmates', gender: 'me', ...vis },
    })
    await setDoc(doc(db, 'profiles', uid, 'private', 'gender'), { value: gender })
    await setDoc(doc(db, 'profiles', uid, 'private', 'phone'), { value: '+911234567890' })
  })
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-travelbuddy',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})
afterAll(() => env.cleanup())
beforeEach(() => env.clearFirestore())

describe('campus gate', () => {
  it('blocks non-campus and unverified accounts', async () => {
    await seedUser('alice', 'woman')
    await assertFails(getDoc(doc(ctx('eve', 'eve@gmail.com'), 'profiles', 'alice')))
    await assertFails(getDoc(doc(ctx('eve', 'eve@vitstudent.ac.in', false), 'profiles', 'alice')))
    await assertSucceeds(getDoc(doc(ctx('bob'), 'profiles', 'alice')))
  })
})

describe('contact privacy', () => {
  it('hides phone from strangers, shows it to travel mates', async () => {
    await seedUser('alice', 'woman')
    await assertSucceeds(getDoc(doc(ctx('alice'), 'profiles', 'alice', 'private', 'phone')))
    await assertFails(getDoc(doc(ctx('bob'), 'profiles', 'alice', 'private', 'phone')))
    await env.withSecurityRulesDisabled((c) =>
      setDoc(doc(c.firestore(), 'connections', 'alice_bob'), { uids: ['alice', 'bob'], memberUid: 'bob', tripId: 't' }))
    await assertSucceeds(getDoc(doc(ctx('bob'), 'profiles', 'alice', 'private', 'phone')))
    await assertFails(getDoc(doc(ctx('carol'), 'profiles', 'alice', 'private', 'phone')))
  })

  it('"campus" visibility is readable by any campus user', async () => {
    await seedUser('alice', 'woman', { phone: 'campus' })
    await assertSucceeds(getDoc(doc(ctx('carol'), 'profiles', 'alice', 'private', 'phone')))
  })

  it('"me" visibility is owner only', async () => {
    await seedUser('alice', 'woman', { phone: 'me' })
    await assertFails(getDoc(doc(ctx('bob'), 'profiles', 'alice', 'private', 'phone')))
  })

  it('rejects an invalid phone or Instagram value', async () => {
    await seedUser('alice', 'woman')
    const db = ctx('alice')
    await assertFails(setDoc(doc(db, 'profiles', 'alice', 'private', 'phone'), { value: 'drop table' }))
    await assertFails(setDoc(doc(db, 'profiles', 'alice', 'private', 'instagram'), { value: 'a b!' }))
    await assertSucceeds(setDoc(doc(db, 'profiles', 'alice', 'private', 'instagram'), { value: 'alice_01' }))
  })
})

describe('women-only / men-only trips', () => {
  beforeEach(async () => {
    await seedUser('alice', 'woman')
    await seedUser('bob', 'man')
    await seedUser('nia', 'nonbinary')
  })

  it('only a woman can host a women-only trip, only a man a men-only trip', async () => {
    await assertSucceeds(setDoc(doc(ctx('alice'), 'trips', 't1'), trip('alice', 'women_only')))
    await assertFails(setDoc(doc(ctx('bob'), 'trips', 't2'), trip('bob', 'women_only')))
    await assertSucceeds(setDoc(doc(ctx('bob'), 'trips', 't3'), trip('bob', 'men_only')))
    await assertFails(setDoc(doc(ctx('alice'), 'trips', 't4'), trip('alice', 'men_only')))
    await assertSucceeds(setDoc(doc(ctx('nia'), 'trips', 't5'), trip('nia', 'anyone')))
    await assertFails(setDoc(doc(ctx('nia'), 'trips', 't6'), trip('nia', 'women_only')))
  })

  it('only women can request to join a women-only trip', async () => {
    await assertSucceeds(setDoc(doc(ctx('alice'), 'trips', 't1'), trip('alice', 'women_only')))
    await seedUser('dia', 'woman')
    await assertSucceeds(setDoc(doc(ctx('dia'), 'trips', 't1', 'requests', 'dia'), { status: 'pending' }))
    await assertFails(setDoc(doc(ctx('bob'), 'trips', 't1', 'requests', 'bob'), { status: 'pending' }))
    await assertFails(setDoc(doc(ctx('nia'), 'trips', 't1', 'requests', 'nia'), { status: 'pending' }))
  })

  it('a user without a gender on file cannot join a restricted trip', async () => {
    await assertSucceeds(setDoc(doc(ctx('alice'), 'trips', 't1'), trip('alice', 'women_only')))
    await assertFails(setDoc(doc(ctx('zed'), 'trips', 't1', 'requests', 'zed'), { status: 'pending' }))
  })

  it('the audience cannot be changed after posting', async () => {
    await assertSucceeds(setDoc(doc(ctx('alice'), 'trips', 't1'), trip('alice', 'women_only')))
    await assertFails(setDoc(doc(ctx('alice'), 'trips', 't1'), trip('alice', 'anyone')))
  })
})

describe('private chat', () => {
  beforeEach(async () => {
    await seedUser('alice', 'woman')
    await seedUser('bob', 'man')
    await assertSucceeds(setDoc(doc(ctx('alice'), 'trips', 't1'), trip('alice', 'anyone')))
  })

  const conv = (tripId = 't1') => ({
    uids: ['alice', 'bob'], names: { alice: 'A', bob: 'B' }, tripId, lastMessage: 'hi', lastAt: serverTimestamp(),
  })

  it('a chat can start with the trip host, but not with a stranger', async () => {
    await assertSucceeds(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob'), conv()))
    await assertFails(setDoc(doc(ctx('bob'), 'conversations', 'bob_carol'),
      { ...conv(), uids: ['bob', 'carol'] }))
  })

  it('only participants read messages; outsiders cannot', async () => {
    await assertSucceeds(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob'), conv()))
    await assertSucceeds(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob', 'messages', 'm1'),
      { senderId: 'bob', text: 'hello', createdAt: serverTimestamp() }))
    await assertSucceeds(getDoc(doc(ctx('alice'), 'conversations', 'alice_bob', 'messages', 'm1')))
    await assertFails(getDoc(doc(ctx('eve'), 'conversations', 'alice_bob', 'messages', 'm1')))
    await assertFails(setDoc(doc(ctx('eve'), 'conversations', 'alice_bob', 'messages', 'm2'),
      { senderId: 'eve', text: 'spam', createdAt: serverTimestamp() }))
  })

  it('cannot forge another sender or send an oversize message', async () => {
    await assertSucceeds(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob'), conv()))
    await assertFails(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob', 'messages', 'm1'),
      { senderId: 'alice', text: 'forged', createdAt: serverTimestamp() }))
    await assertFails(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob', 'messages', 'm2'),
      { senderId: 'bob', text: 'x'.repeat(1001), createdAt: serverTimestamp() }))
  })

  it('a blocked person cannot message the blocker', async () => {
    await assertSucceeds(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob'), conv()))
    await assertSucceeds(setDoc(doc(ctx('alice'), 'profiles', 'alice', 'blocked', 'bob'), { createdAt: serverTimestamp() }))
    await assertFails(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob', 'messages', 'm1'),
      { senderId: 'bob', text: 'still here', createdAt: serverTimestamp() }))
  })
})

describe('issues and reports', () => {
  it('lets users file and read their own, never anyone else\'s', async () => {
    const issue = { authorId: 'alice', category: 'safety', text: 'driver was rude', status: 'open', createdAt: serverTimestamp() }
    await assertSucceeds(setDoc(doc(ctx('alice'), 'issues', 'i1'), issue))
    await assertSucceeds(getDoc(doc(ctx('alice'), 'issues', 'i1')))
    await assertFails(getDoc(doc(ctx('bob'), 'issues', 'i1')))
    await assertFails(setDoc(doc(ctx('bob'), 'issues', 'i2'), { ...issue, authorId: 'alice' }))
  })
})

describe('deleting a trip', () => {
  beforeEach(async () => {
    await seedUser('alice', 'woman')
    await seedUser('bob', 'man')
    await assertSucceeds(setDoc(doc(ctx('alice'), 'trips', 't1'), trip('alice', 'anyone')))
  })

  it('lets the host delete their own trip', async () => {
    await assertSucceeds(deleteDoc(doc(ctx('alice'), 'trips', 't1')))
  })

  it('does not let anyone else delete it', async () => {
    await assertFails(deleteDoc(doc(ctx('bob'), 'trips', 't1')))
    await assertFails(deleteDoc(doc(ctx('eve', 'eve@gmail.com'), 'trips', 't1')))
  })

  it('lets the host delete a trip that already has join requests', async () => {
    await assertSucceeds(setDoc(doc(ctx('bob'), 'trips', 't1', 'requests', 'bob'), { status: 'pending' }))
    await assertSucceeds(deleteDoc(doc(ctx('alice'), 'trips', 't1')))
  })
})

describe('account deletion', () => {
  beforeEach(async () => {
    await seedUser('alice', 'woman')
    await seedUser('bob', 'man')
    await assertSucceeds(setDoc(doc(ctx('alice'), 'trips', 't1'), trip('alice', 'anyone')))
    await assertSucceeds(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob'), {
      uids: ['alice', 'bob'], names: { alice: 'A', bob: 'B' }, tripId: 't1', lastMessage: 'hi', lastAt: serverTimestamp(),
    }))
    await assertSucceeds(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob', 'messages', 'm1'),
      { senderId: 'bob', text: 'hello', createdAt: serverTimestamp() }))
    await env.withSecurityRulesDisabled((c) =>
      setDoc(doc(c.firestore(), 'connections', 'alice_bob'), { uids: ['alice', 'bob'], memberUid: 'bob', tripId: 't1' }))
  })

  it('lets someone delete only their own profile and private details', async () => {
    await assertFails(deleteDoc(doc(ctx('bob'), 'profiles', 'alice')))
    await assertFails(deleteDoc(doc(ctx('bob'), 'profiles', 'alice', 'private', 'phone')))
    await assertSucceeds(deleteDoc(doc(ctx('alice'), 'profiles', 'alice', 'private', 'phone')))
    await assertSucceeds(deleteDoc(doc(ctx('alice'), 'profiles', 'alice')))
  })

  it('lets a participant remove a chat and its messages, but not an outsider', async () => {
    await assertFails(deleteDoc(doc(ctx('eve'), 'conversations', 'alice_bob', 'messages', 'm1')))
    await assertFails(deleteDoc(doc(ctx('eve'), 'conversations', 'alice_bob')))
    await assertSucceeds(deleteDoc(doc(ctx('alice'), 'conversations', 'alice_bob', 'messages', 'm1')))
    await assertSucceeds(deleteDoc(doc(ctx('alice'), 'conversations', 'alice_bob')))
  })

  it('lets either person remove a connection, but not an outsider', async () => {
    await assertFails(deleteDoc(doc(ctx('eve'), 'connections', 'alice_bob')))
    await assertSucceeds(deleteDoc(doc(ctx('bob'), 'connections', 'alice_bob')))
  })

  it('still never lets anyone edit messages or connections', async () => {
    await assertFails(setDoc(doc(ctx('bob'), 'conversations', 'alice_bob', 'messages', 'm1'),
      { senderId: 'bob', text: 'edited', createdAt: serverTimestamp() }))
    await assertFails(setDoc(doc(ctx('alice'), 'connections', 'alice_bob'), { uids: ['alice', 'bob'], memberUid: 'bob', tripId: 'zzz' }))
  })

  it('does not let anyone else delete a profile after it is gone', async () => {
    await assertSucceeds(deleteDoc(doc(ctx('alice'), 'profiles', 'alice')))
    await assertFails(getDoc(doc(ctx('bob'), 'profiles', 'alice', 'private', 'phone')))
  })
})

describe('eraseUserData end to end (under the real rules)', () => {
  it('removes everything about the person, and leaves other people untouched', async () => {
    await seedUser('alice', 'woman')
    await seedUser('bob', 'man')
    await env.withSecurityRulesDisabled(async (c) => {
      const a = c.firestore()
      // alice hosts a trip with a request from bob; bob hosts one that alice asked to join
      await setDoc(doc(a, 'trips', 'tA'), trip('alice', 'anyone'))
      await setDoc(doc(a, 'trips', 'tA', 'requests', 'bob'), { status: 'accepted' })
      await setDoc(doc(a, 'trips', 'tB'), trip('bob', 'anyone'))
      await setDoc(doc(a, 'trips', 'tB', 'requests', 'alice'), { status: 'pending' })
      await setDoc(doc(a, 'connections', 'alice_bob'), { uids: ['alice', 'bob'], memberUid: 'bob', tripId: 'tA' })
      await setDoc(doc(a, 'conversations', 'alice_bob'), { uids: ['alice', 'bob'], names: { alice: 'A', bob: 'B' }, tripId: 'tA', lastMessage: 'hi' })
      await setDoc(doc(a, 'conversations', 'alice_bob', 'messages', 'm1'), { senderId: 'alice', text: 'hey' })
      await setDoc(doc(a, 'conversations', 'alice_bob', 'messages', 'm2'), { senderId: 'bob', text: 'hello' })
      await setDoc(doc(a, 'profiles', 'alice', 'blocked', 'eve'), { createdAt: 1 })
      await setDoc(doc(a, 'profiles', 'alice', 'private', 'instagram'), { value: 'alice_ig' })
      await setDoc(doc(a, 'profiles', 'alice', 'private', 'email'), { value: 'alice@vitstudent.ac.in' })
      await setDoc(doc(a, 'issues', 'i1'), { authorId: 'alice', category: 'safety', text: 'report', status: 'open' })
    })

    await eraseUserData(ctx('alice'), 'alice')

    await env.withSecurityRulesDisabled(async (c) => {
      const a = c.firestore()
      const exists = async (...path: [string, ...string[]]) => (await getDoc(doc(a, ...path))).exists()
      // gone
      for (const path of [
        ['profiles', 'alice'], ['profiles', 'alice', 'private', 'phone'], ['profiles', 'alice', 'private', 'gender'],
        ['profiles', 'alice', 'private', 'instagram'], ['profiles', 'alice', 'private', 'email'], ['profiles', 'alice', 'blocked', 'eve'],
        ['trips', 'tA'], ['trips', 'tA', 'requests', 'bob'], ['trips', 'tB', 'requests', 'alice'],
        ['connections', 'alice_bob'], ['conversations', 'alice_bob'],
        ['conversations', 'alice_bob', 'messages', 'm1'], ['conversations', 'alice_bob', 'messages', 'm2'],
      ] as [string, ...string[]][]) {
        if (await exists(...path)) throw new Error('still exists: ' + path.join('/'))
      }
      // kept
      for (const path of [['issues', 'i1'], ['profiles', 'bob'], ['profiles', 'bob', 'private', 'phone'], ['trips', 'tB']] as [string, ...string[]][]) {
        if (!(await exists(...path))) throw new Error('should still exist: ' + path.join('/'))
      }
      const leftoverTrips = (await getDocs(collection(a, 'trips'))).docs.map((d) => d.id)
      if (leftoverTrips.join() !== 'tB') throw new Error('unexpected trips left: ' + leftoverTrips)
    })
  })

  it('can be run twice (a retry after a partial failure)', async () => {
    await seedUser('alice', 'woman')
    await eraseUserData(ctx('alice'), 'alice')
    await eraseUserData(ctx('alice'), 'alice')
  })
})
