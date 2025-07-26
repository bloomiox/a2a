// Clear AudioGuide App Cache Script
// Run this in the browser console to clear cached settings and force AudioGuide branding

console.log('🔄 Clearing AudioGuide app cache...');

// Clear localStorage
localStorage.removeItem('appSettings');
console.log('✅ localStorage cleared');

// Clear sessionStorage
sessionStorage.removeItem('appSettings');
sessionStorage.removeItem('audioguide_user');
console.log('✅ sessionStorage cleared');

// Clear any other cached data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('turba') || key.includes('base44') || key.includes('audiotour'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Removed cached key: ${key}`);
});

console.log('🎉 Cache cleared! Reloading page with AudioGuide branding...');

// Force reload the page
setTimeout(() => {
  window.location.reload();
}, 1000);