const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add props to component definition
content = content.replace(
  /const TagmeAnalyticsDashboard = \(\{ liveData, tagmeTransfers, loading \}: any\) => \{/,
  `const TagmeAnalyticsDashboard = ({ liveData, tagmeTransfers, loading, taskStatuses, taskPriorities }: any) => {`
);

// 2. Add props to component call
content = content.replace(
  /<TagmeAnalyticsDashboard liveData=\{liveData\} tagmeTransfers=\{tagmeTransfers\} loading=\{loading\} \/>/,
  `<TagmeAnalyticsDashboard liveData={liveData} tagmeTransfers={tagmeTransfers} loading={loading} taskStatuses={taskStatuses} taskPriorities={taskPriorities} />`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Analytics dashboard props patched successfully!");
