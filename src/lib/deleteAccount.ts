import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, query, where, writeBatch,
  type DocumentReference, type Firestore,
} from 'firebase/firestore'
import { deleteUser, reauthenticateWithPopup, type User } from 'firebase/auth'
import { db, googleProvider } from './firebase'

async function removeAll(firestore: Firestore, refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(firestore)
    refs.slice(i, i + 400).forEach((r) => batch.delete(r))
    await batch.commit()
  }
}

/**
 * Erases a person's Firestore data. Safe to run again if it stops halfway:
 * every step deletes whatever is left.
 *
 * Removed: chats (for both people), connections, hosted trips and their join
 * requests, the person's own join requests, block list, contact details, profile.
 * Kept: reports they filed (so safety reports are not lost).
 */
export async function eraseUserData(firestore: Firestore, uid: string, onStep: (text: string) => void = () => {}) {
  onStep('Removing your chats…')
  const chats = await getDocs(query(collection(firestore, 'conversations'), where('uids', 'array-contains', uid)))
  for (const c of chats.docs) {
    const msgs = await getDocs(collection(firestore, 'conversations', c.id, 'messages'))
    await removeAll(firestore, msgs.docs.map((m) => m.ref))
    await deleteDoc(c.ref)
  }

  onStep('Removing your connections…')
  const links = await getDocs(query(collection(firestore, 'connections'), where('uids', 'array-contains', uid)))
  await removeAll(firestore, links.docs.map((l) => l.ref))

  onStep('Removing the trips you posted…')
  const hosted = await getDocs(query(collection(firestore, 'trips'), where('hostId', '==', uid)))
  for (const t of hosted.docs) {
    const reqs = await getDocs(collection(firestore, 'trips', t.id, 'requests'))
    await removeAll(firestore, reqs.docs.map((r) => r.ref))
    await deleteDoc(t.ref)
  }

  onStep('Withdrawing your join requests…')
  const trips = await getDocs(query(collection(firestore, 'trips'), limit(1000)))
  for (let i = 0; i < trips.docs.length; i += 25) {
    await Promise.all(trips.docs.slice(i, i + 25).map(async (t) => {
      const ref = doc(firestore, 'trips', t.id, 'requests', uid)
      if ((await getDoc(ref)).exists()) await deleteDoc(ref)
    }))
  }

  onStep('Removing your profile…')
  const blocked = await getDocs(collection(firestore, 'profiles', uid, 'blocked'))
  await removeAll(firestore, blocked.docs.map((b) => b.ref))
  await removeAll(firestore, ['phone', 'email', 'instagram', 'gender'].map((f) => doc(firestore, 'profiles', uid, 'private', f)))
  await deleteDoc(doc(firestore, 'profiles', uid))
}

/** Full account deletion: confirm identity, erase the data, then close the sign-in. */
export async function deleteAccount(user: User, onStep: (text: string) => void) {
  // First, because it needs a click and a recent sign-in is required to delete the login.
  onStep('Confirming it is you…')
  await reauthenticateWithPopup(user, googleProvider)

  await eraseUserData(db, user.uid, onStep)

  onStep('Closing your account…')
  await deleteUser(user)
}
