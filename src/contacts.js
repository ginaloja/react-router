import localforage from 'localforage';
import { matchSorter } from 'match-sorter';

// Simulated network delay function
async function fakeNetwork(key) {
  if (fakeCache[key]) {
    return;
  }
  fakeCache[key] = true;
  return new Promise((resolve) => {
    setTimeout(resolve, Math.random() * 800);
  });
}

// In-memory cache to avoid unnecessary network delay simulation on subsequent calls
let fakeCache = {};

// Retrieve contacts, optionally filtering them based on a search query
export async function getContacts(query) {
  await fakeNetwork(`getContacts:${query}`);
  let contacts = (await localforage.getItem('contacts')) || [];
  if (query) {
    contacts = matchSorter(contacts, query, { keys: ['first', 'last'] });
  }
  // Sort contacts by 'last' name and then by 'createdAt' timestamp
  return contacts.sort((a, b) => {
    const lastNameComparison = a.last.localeCompare(b.last);
    if (lastNameComparison !== 0) {
      return lastNameComparison;
    }
    return a.createdAt - b.createdAt;
  });
}

// Create a new contact with a unique ID and the current timestamp
export async function createContact() {
  await fakeNetwork();
  const id = Math.random().toString(36).substring(2, 9);
  const contact = { id, createdAt: Date.now() };
  let contacts = await getContacts();
  contacts.unshift(contact);
  await set(contacts);
  return contact;
}

// Retrieve a specific contact by ID
export async function getContact(id) {
  await fakeNetwork(`contact:${id}`);
  let contacts = await localforage.getItem('contacts') || [];
  const contact = contacts.find((contact) => contact.id === id);
  return contact ?? null;
}

// Update an existing contact by ID with the provided updates
export async function updateContact(id, updates) {
  await fakeNetwork();
  let contacts = await localforage.getItem('contacts') || [];
  const contactIndex = contacts.findIndex((contact) => contact.id === id);
  if (contactIndex === -1) throw new Error('No contact found for', id);
  const updatedContact = { ...contacts[contactIndex], ...updates };
  contacts[contactIndex] = updatedContact;
  await set(contacts);
  return updatedContact;
}

// Delete a contact by ID
export async function deleteContact(id) {
  let contacts = await localforage.getItem('contacts') || [];
  const index = contacts.findIndex((contact) => contact.id === id);
  if (index > -1) {
    contacts.splice(index, 1);
    await set(contacts);
    return true;
  }
  return false;
}

// Helper function to update the contacts list in local storage
function set(contacts) {
  return localforage.setItem('contacts', contacts);
}
