import fs from 'fs';
import path from 'path';

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('dist') && !dirFile.includes('.git')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.json') || dirFile.endsWith('.md')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(process.cwd());

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let newContent = content;

  // Role renaming
  newContent = newContent.replace(/Role\.Undercover/g, 'Role.Spy');
  newContent = newContent.replace(/Undercover agents/g, 'Spies');
  newContent = newContent.replace(/Undercover agent/g, 'Spy');
  newContent = newContent.replace(/undercoverWord/g, 'spyWord');
  newContent = newContent.replace(/aliveUndercover/g, 'aliveSpies');
  
  // Specific Embeds and text
  newContent = newContent.replace(/Your Role: Undercover/g, 'Your Role: Spy');
  newContent = newContent.replace(/You are \*\*Undercover\*\*/g, 'You are the **Spy**');
  newContent = newContent.replace(/Undercover Wins/g, 'Spy Wins');
  newContent = newContent.replace(/🕵️ Undercover:/g, '🕵️ Spy:');
  
  // Branding
  newContent = newContent.replace(/Undercover — Lobby/g, "Who's the Spy — Lobby");
  newContent = newContent.replace(/Undercover — Game Status/g, "Who's the Spy — Game Status");
  newContent = newContent.replace(/Undercover •/g, "Who's the Spy •");
  newContent = newContent.replace(/Undercover game/g, "Who's the Spy game");
  newContent = newContent.replace(/Undercover social deduction/g, "Who's the Spy social deduction");
  newContent = newContent.replace(/Undercover — Discord Party/g, "Who's the Spy — Discord Party");

  // Commands
  newContent = newContent.replace(/\/undercover /g, '/whosthespy ');
  newContent = newContent.replace(/'undercover'/g, "'whosthespy'");
  newContent = newContent.replace(/"undercover"/g, '"whosthespy"');
  
  // Custom ID prefix
  newContent = newContent.replace(/uc:/g, 'wts:');
  newContent = newContent.replace(/'uc'/g, "'wts'");

  // Types & properties
  newContent = newContent.replace(/undercover: number/g, 'spy: number');
  newContent = newContent.replace(/undercover: 1/g, 'spy: 1');
  newContent = newContent.replace(/undercover: 2/g, 'spy: 2');
  newContent = newContent.replace(/undercover: 3/g, 'spy: 3');
  newContent = newContent.replace(/undercover: base.undercover/g, 'spy: base.spy');
  newContent = newContent.replace(/dist.undercover/g, 'dist.spy');
  newContent = newContent.replace(/undercover: pair/g, 'spy: pair');
  newContent = newContent.replace(/pair.undercover/g, 'pair.spy');

  // Package.json
  newContent = newContent.replace(/undercover-bot/g, 'whosthespy-bot');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf-8');
    console.log(`Updated ${file}`);
  }
}

// Rename command file
const cmdPath = path.join(process.cwd(), 'src', 'commands', 'undercover.ts');
if (fs.existsSync(cmdPath)) {
  fs.renameSync(cmdPath, path.join(process.cwd(), 'src', 'commands', 'whosthespy.ts'));
  console.log(`Renamed commands file`);
}

// Update imports
for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('commands/undercover.js')) {
    content = content.replace(/commands\/undercover\.js/g, 'commands/whosthespy.js');
    fs.writeFileSync(file, content, 'utf-8');
  }
}
