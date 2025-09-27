export const generateVCard = (
  identity: { fullName: string; jobTitle: string; department: string },
  contact: { phoneNumbers: string; emailAddress: string; websiteLink: string; officeAddress: string },
  organization: string
): string => {
  const vcard: string[] = [];
  vcard.push("BEGIN:VCARD");
  vcard.push("VERSION:3.0");

  // Name
  const [firstName, ...lastNameParts] = identity.fullName.split(' ');
  const lastName = lastNameParts.join(' ');
  vcard.push(`N:${lastName};${firstName};;;`);
  vcard.push(`FN:${identity.fullName}`);

  // Organization & Title
  vcard.push(`ORG:${organization};${identity.department}`);
  vcard.push(`TITLE:${identity.jobTitle}`);

  // Contact Info
  if (contact.phoneNumbers) {
    contact.phoneNumbers.split(',').forEach(phone => {
      const cleanedPhone = phone.trim().replace(/[^0-9+]/g, ''); // Remove non-numeric except '+'
      if (cleanedPhone) vcard.push(`TEL;TYPE=WORK,VOICE:${cleanedPhone}`);
    });
  }
  if (contact.emailAddress) vcard.push(`EMAIL;TYPE=INTERNET,WORK:${contact.emailAddress}`);
  if (contact.websiteLink) vcard.push(`URL;TYPE=WORK:${contact.websiteLink}`);
  if (contact.officeAddress) vcard.push(`ADR;TYPE=WORK:;;${contact.officeAddress};;;;`);

  vcard.push("END:VCARD");
  return vcard.join("\n");
};