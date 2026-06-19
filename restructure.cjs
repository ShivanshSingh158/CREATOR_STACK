const fs = require('fs');
const path = require('path').posix; // Use posix for predictable forward slashes
const osPath = require('path');

const srcDir = osPath.join(__dirname, 'src').replace(/\\/g, '/');

const dirsToCreate = [
  'components/layout',
  'features/auth',
  'features/onboarding',
  'features/brand',
  'features/creator',
  'features/campaign',
  'features/messaging',
  'features/deal-room',
  'hooks'
];

dirsToCreate.forEach(dir => {
  const fullPath = osPath.join(__dirname, 'src', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const fileMoves = [
  ['components/Navbar.tsx', 'components/layout/Navbar.tsx'],
  ['contexts/AuthContext.tsx', 'features/auth/AuthContext.tsx'],
  ['pages/LoginPage.tsx', 'features/auth/LoginPage.tsx'],
  ['pages/SignupPage.tsx', 'features/auth/SignupPage.tsx'],
  ['pages/BrandOnboarding.tsx', 'features/onboarding/BrandOnboarding.tsx'],
  ['pages/CreatorOnboarding.tsx', 'features/onboarding/CreatorOnboarding.tsx'],
  ['pages/BrandDashboard.tsx', 'features/brand/BrandDashboard.tsx'],
  ['pages/CampaignManage.tsx', 'features/brand/CampaignManage.tsx'],
  ['pages/CreatorDashboard.tsx', 'features/creator/CreatorDashboard.tsx'],
  ['pages/ProfilePage.tsx', 'features/creator/ProfilePage.tsx'],
  ['pages/CreatorProfileDetail.tsx', 'features/creator/CreatorProfileDetail.tsx'],
  ['pages/CreateCampaign.tsx', 'features/campaign/CreateCampaign.tsx'],
  ['pages/MatchmakingEngine.tsx', 'features/campaign/MatchmakingEngine.tsx'],
  ['pages/MessageDashboard.tsx', 'features/messaging/MessageDashboard.tsx'],
  ['pages/DigitalDealRoom.tsx', 'features/deal-room/DigitalDealRoom.tsx']
];

const movedFilesMap = {};
fileMoves.forEach(([oldPath, newPath]) => {
  movedFilesMap[oldPath] = newPath;
});

const getAllFiles = function(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push((dirPath + "/" + file).replace(/\\/g, '/'));
    }
  });
  return arrayOfFiles;
};

const allFiles = getAllFiles(srcDir);

function processFileImports(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  const currentRelToSrc = filePath.replace(srcDir + '/', '');
  const newRelToSrc = movedFilesMap[currentRelToSrc] || currentRelToSrc;
  const newFileDir = path.dirname(newRelToSrc);
  
  content = content.replace(/from\s+['"]([^'"]+)['"]/g, (match, importPath) => {
    if (!importPath.startsWith('.')) return match;
    
    const oldFileDir = path.dirname(currentRelToSrc);
    let importedModuleRelToSrc = path.normalize(path.join(oldFileDir, importPath));
    
    let mappedModule = importedModuleRelToSrc;
    if (movedFilesMap[importedModuleRelToSrc + '.tsx']) {
      mappedModule = movedFilesMap[importedModuleRelToSrc + '.tsx'].replace(/\.tsx$/, '');
    } else if (movedFilesMap[importedModuleRelToSrc + '.ts']) {
      mappedModule = movedFilesMap[importedModuleRelToSrc + '.ts'].replace(/\.ts$/, '');
    }
    
    let newImportPath = path.relative(newFileDir, mappedModule);
    if (!newImportPath.startsWith('.')) {
      newImportPath = './' + newImportPath;
    }
    
    return `from '${newImportPath}'`;
  });
  
  fs.writeFileSync(filePath, content);
}

allFiles.forEach(processFileImports);

fileMoves.forEach(([oldPath, newPath]) => {
  const fullOldPath = osPath.join(__dirname, 'src', oldPath);
  const fullNewPath = osPath.join(__dirname, 'src', newPath);
  if (fs.existsSync(fullOldPath)) {
    fs.renameSync(fullOldPath, fullNewPath);
  }
});

console.log("Restructure Phase 1 completed.");
