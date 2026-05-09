const fs = require('fs');
const path = require('path');

const filePaths = [
  path.join(__dirname, 'src', 'tabs', 'ProfileTab.tsx'),
  path.join(__dirname, 'src', 'tabs', 'HomeTab', 'modals', 'MainMenuSidebar.tsx')
];

filePaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace light-mode dark-mode pairs: "light-class dark:dark-class" -> "dark-class"
    content = content.replace(/\b\S+\s+dark:(\S+)/g, '$1');
    
    // Replace any remaining "dark:" prefixes
    content = content.replace(/dark:/g, '');
    
    fs.writeFileSync(filePath, content);
    console.log(`Processed ${filePath}`);
  }
});
