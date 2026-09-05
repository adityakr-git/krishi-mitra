/**
 * Utility for namespacing profile picture storage keys based on active role.
 * Prevents cross-role avatar bleeding between Farmer, Officer, and Admin dashboards.
 */

export const getActiveRole = (fallbackRole?: string): string => {
  if (typeof window === 'undefined') return 'default';
  return (
    localStorage.getItem('krishi_mitra_session') ||
    fallbackRole ||
    'default'
  ).toLowerCase();
};

export const getProfilePicKey = (roleOverride?: string): string => {
  const activeRole = getActiveRole(roleOverride);
  return `krishi_mitra_profile_pic_${activeRole}`;
};

export const getSavedProfilePic = (roleOverride?: string): string | null => {
  if (typeof window === 'undefined') return null;
  // Auto-clean any legacy corrupted un-namespaced generic key
  if (localStorage.getItem('krishi_mitra_profile_pic')) {
    localStorage.removeItem('krishi_mitra_profile_pic');
  }
  return localStorage.getItem(getProfilePicKey(roleOverride));
};

export const saveProfilePic = (base64String: string, roleOverride?: string): void => {
  if (typeof window === 'undefined') return;
  const key = getProfilePicKey(roleOverride);
  localStorage.setItem(key, base64String);
  window.dispatchEvent(new Event('krishi_mitra_profile_updated'));
};
