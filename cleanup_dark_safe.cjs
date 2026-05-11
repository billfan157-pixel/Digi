const fs = require('fs');
const path = require('path');

const filePaths = [
  path.join(__dirname, 'src', 'tabs', 'ProfileTab.tsx'),
  path.join(__dirname, 'src', 'tabs', 'HomeTab', 'modals', 'MainMenuSidebar.tsx')
];

const tailwindClassRegex = /([a-zA-Z0-9\-\/\[\]_(),.#%]+)\s+dark:([a-zA-Z0-9\-\/\[\]_(),.#%]+)/g;
const darkPrefixRegex = /dark:([a-zA-Z0-9\-\/\[\]_(),.#%]+)/g;

filePaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace light-mode dark-mode pairs: "light-class dark:dark-class" -> "dark-class"
    content = content.replace(tailwindClassRegex, '$2');
    
    // Replace any remaining "dark:" prefixes
    content = content.replace(darkPrefixRegex, '$1');
    
    fs.writeFileSync(filePath, content);
    console.log(`Processed ${filePath}`);
  }
});
