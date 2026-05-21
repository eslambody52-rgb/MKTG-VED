const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add taskPriorities and taskStatuses states (after assignedDates)
content = content.replace(
  /const \[assignedDates, setAssignedDates\] = useState<Record<string, string>>\(\(\) => \{[\s\S]*?\}\);/,
  `$&

  const [taskPriorities, setTaskPriorities] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('task_priorities');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  const [taskStatuses, setTaskStatuses] = useState<Record<string, { done: boolean, cancel: boolean }>>(() => {
    const saved = localStorage.getItem('task_statuses');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });`
);

// 2. Add syncState and fetch initial metadata (after assignedDates / inside component before useEffects)
// Find the `const [subscribedTasks...` block and put it before that.
content = content.replace(
  /const \[subscribedTasks, setSubscribedTasks\]/,
  `const syncState = async (field: string, dict: any, itemKey: string, taskName: string, type: string, message: string) => {
    localStorage.setItem(field, JSON.stringify(dict));
    fetch('/api/task-metadata', {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ field, metadata: dict })
    }).catch(e => console.error(e));

    if (globalChannelRef.current && profile?.name) {
       globalChannelRef.current.send({
          type: 'broadcast',
          event: 'update',
          payload: { itemKey, taskName, message, type, from: profile.name, field, dict }
       });
    }
  };

  useEffect(() => {
    fetch('/api/task-metadata')
      .then(res => res.json())
      .then(data => {
         if (data?.metadata) {
            const m = data.metadata;
            if (m.assigned_editors) { setAssignedEditors(m.assigned_editors); localStorage.setItem('assigned_editors', JSON.stringify(m.assigned_editors)); }
            if (m.editor_notes) { setEditorNotes(m.editor_notes); localStorage.setItem('editor_notes', JSON.stringify(m.editor_notes)); }
            if (m.marketing_notes) { setMarketingNotes(m.marketing_notes); localStorage.setItem('marketing_notes', JSON.stringify(m.marketing_notes)); }
            if (m.assigned_opsheets) { setAssignedOpSheets(m.assigned_opsheets); localStorage.setItem('assigned_opsheets', JSON.stringify(m.assigned_opsheets)); }
            if (m.assigned_branches) { setAssignedBranches(m.assigned_branches); localStorage.setItem('assigned_branches', JSON.stringify(m.assigned_branches)); }
            if (m.assigned_dates) { setAssignedDates(m.assigned_dates); localStorage.setItem('assigned_dates', JSON.stringify(m.assigned_dates)); }
            if (m.task_priorities) { setTaskPriorities(m.task_priorities); localStorage.setItem('task_priorities', JSON.stringify(m.task_priorities)); }
            if (m.task_statuses) { setTaskStatuses(m.task_statuses); localStorage.setItem('task_statuses', JSON.stringify(m.task_statuses)); }
         }
      })
      .catch(e => console.error(e));
  }, []);

  const [subscribedTasks, setSubscribedTasks]`
);

// 3. Update broadcast receiver to use `field` and `dict`
content = content.replace(
  /const \{ itemKey, taskName, message, type, from \} = payload;/,
  `const { itemKey, taskName, message, type, from, field, dict } = payload;
      
      if (field && dict) {
         localStorage.setItem(field, JSON.stringify(dict));
         if (field === 'assigned_editors') setAssignedEditors(dict);
         else if (field === 'editor_notes') setEditorNotes(dict);
         else if (field === 'marketing_notes') setMarketingNotes(dict);
         else if (field === 'assigned_opsheets') setAssignedOpSheets(dict);
         else if (field === 'assigned_branches') setAssignedBranches(dict);
         else if (field === 'assigned_dates') setAssignedDates(dict);
         else if (field === 'task_priorities') setTaskPriorities(dict);
         else if (field === 'task_statuses') setTaskStatuses(dict);
      }`
);

// 4. Update handleUpdateEditor, handleUpdateOpSheet, handleUpdateBranch, handleUpdateDate, handleUpdateEditorNotes, handleUpdateMarketingNotes
// Replace broadcastTaskUpdate inside these functions with syncState
content = content.replace(
  /const handleUpdateEditor = \(itemKey: string, newEditor: string\) => \{[\s\S]*?broadcastTaskUpdate\(.*?\);[\s\S]*?\};/,
  `const handleUpdateEditor = (itemKey: string, newEditor: string) => {
    setAssignedEditors(prev => {
      const updated = { ...prev, [itemKey]: newEditor };
      const taskName = findTaskName(itemKey);
      syncState('assigned_editors', updated, itemKey, taskName, 'editor', \`👤 تم إسناد التجميعة للمحرر: \${newEditor}\`);
      return updated;
    });
  };`
);

content = content.replace(
  /const handleUpdateOpSheet = \(itemKey: string, val: string\) => \{[\s\S]*?broadcastTaskUpdate\(.*?\);[\s\S]*?\};/,
  `const handleUpdateOpSheet = (itemKey: string, val: string) => {
    setAssignedOpSheets(prev => {
      const updated = { ...prev, [itemKey]: val };
      const taskName = findTaskName(itemKey);
      syncState('assigned_opsheets', updated, itemKey, taskName, 'opsheet', \`📂 تم تعديل المرحلة إلى: \${val || 'غير محدد'}\`);
      return updated;
    });
  };`
);

content = content.replace(
  /const handleUpdateBranch = \(itemKey: string, val: string\) => \{[\s\S]*?broadcastTaskUpdate\(.*?\);[\s\S]*?\};/,
  `const handleUpdateBranch = (itemKey: string, val: string) => {
    setAssignedBranches(prev => {
      const updated = { ...prev, [itemKey]: val };
      const taskName = findTaskName(itemKey);
      syncState('assigned_branches', updated, itemKey, taskName, 'branch', \`🏢 تم تحويل الفرع إلى: \${val || 'غير محدد'}\`);
      return updated;
    });
  };`
);

content = content.replace(
  /const handleUpdateDate = \(itemKey: string, val: string\) => \{[\s\S]*?broadcastTaskUpdate\(.*?\);[\s\S]*?\};/,
  `const handleUpdateDate = (itemKey: string, val: string) => {
    setAssignedDates(prev => {
      const updated = { ...prev, [itemKey]: val };
      const taskName = findTaskName(itemKey);
      syncState('assigned_dates', updated, itemKey, taskName, 'date', \`📅 تم تعديل التاريخ إلى: \${val || 'غير محدد'}\`);
      return updated;
    });
  };`
);

content = content.replace(
  /const handleUpdateEditorNotes = \(itemKey: string, noteText: string, editorName\?: string\) => \{[\s\S]*?return updated;\s*\}\);\s*if \(noteText\.trim\(\)\) \{[\s\S]*?broadcastTaskUpdate\(.*?\);[\s\S]*?\}\s*\};/,
  `const handleUpdateEditorNotes = (itemKey: string, noteText: string, editorName?: string) => {
    setEditorNotes(prev => {
      const updated = { ...prev, [itemKey]: noteText };
      if (noteText.trim()) {
        const taskName = findTaskName(itemKey);
        syncState('editor_notes', updated, itemKey, taskName, 'note', \`📝 ملاحظة جديدة: "\${noteText.slice(0, 60)}\${noteText.length > 60 ? '...' : ''}"\`);
      } else {
        localStorage.setItem('editor_notes', JSON.stringify(updated));
        fetch('/api/task-metadata', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field: 'editor_notes', metadata: updated }) }).catch(e => console.error(e));
      }
      return updated;
    });
  };`
);

content = content.replace(
  /const handleUpdateMarketingNotes = \(itemKey: string, noteText: string, editorName\?: string\) => \{[\s\S]*?return updated;\s*\}\);\s*if \(noteText\.trim\(\)\) \{[\s\S]*?broadcastTaskUpdate\(.*?\);[\s\S]*?\}\s*\};/,
  `const handleUpdateMarketingNotes = (itemKey: string, noteText: string, editorName?: string) => {
    setMarketingNotes(prev => {
      const updated = { ...prev, [itemKey]: noteText };
      if (noteText.trim()) {
        const taskName = findTaskName(itemKey);
        syncState('marketing_notes', updated, itemKey, taskName, 'marketing_note', \`💬 ملاحظة تسويق: "\${noteText.slice(0, 60)}\${noteText.length > 60 ? '...' : ''}"\`);
      } else {
        localStorage.setItem('marketing_notes', JSON.stringify(updated));
        fetch('/api/task-metadata', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ field: 'marketing_notes', metadata: updated }) }).catch(e => console.error(e));
      }
      return updated;
    });
  };`
);

// 5. Update handleStatusChange
content = content.replace(
  /const handleStatusChange = \(itemKey: string, taskName: string, editorName: string, type: string\) => \{[\s\S]*?broadcastTaskUpdate\(.*?\);\s*\};/,
  `const handleStatusChange = (itemKey: string, taskName: string, editorName: string, type: string) => {
    const msgMap: Record<string, string> = {
      done: '✅ تم تحديد التجميعة كـ مكتملة',
      undone: '↩️ تم إلغاء تحديد التجميعة كمكتملة',
      cancel: '❌ تم تحديد التجميعة كـ ملغاة',
      uncancel: '↩️ تم إلغاء تحديد التجميعة كملغاة',
      priority: '⚠️ تم تحديد التجميعة كأولوية قصوى',
      unpriority: '➖ تم إزالة الأولوية القصوى عن التجميعة',
    };
    const message = msgMap[type] || \`تغيير في التجميعة\`;

    if (type === 'priority' || type === 'unpriority') {
       const isPri = type === 'priority';
       setTaskPriorities(prev => {
          const n = { ...prev, [itemKey]: isPri };
          syncState('task_priorities', n, itemKey, taskName, type, message);
          return n;
       });
    } else {
       const done = (type === 'done' || type === 'uncancel') ? true : false;
       const cancel = type === 'cancel';
       setTaskStatuses(prev => {
          const n = { ...prev, [itemKey]: { done, cancel } };
          syncState('task_statuses', n, itemKey, taskName, type, message);
          return n;
       });
    }
  };`
);

// 6. Update TagmeRow definition to receive overrides
content = content.replace(
  /const TagmeRow = \(\{ item, index, onUpdateEditor, editorsList, onUpdateEditorNotes, onUpdateMarketingNotes, opSheetsList, branchesList, onUpdateOpSheet, onUpdateBranch, onUpdateDate, isGlowing, liveData, canRaisePriority, priorityLimit, onStatusChange, isSubscribed, onToggleSubscribe \}: any\) => \{/,
  `const TagmeRow = ({ item, index, onUpdateEditor, editorsList, onUpdateEditorNotes, onUpdateMarketingNotes, opSheetsList, branchesList, onUpdateOpSheet, onUpdateBranch, onUpdateDate, isGlowing, liveData, canRaisePriority, priorityLimit, onStatusChange, isSubscribed, onToggleSubscribe, priorityOverride, statusOverride }: any) => {`
);

// 7. Update TagmeRow to use overrides
content = content.replace(
  /const \[copied, setCopied\] = useState\(false\);/,
  `const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (priorityOverride !== undefined) setPriority(priorityOverride);
  }, [priorityOverride]);

  useEffect(() => {
    if (statusOverride !== undefined) {
       setDone(statusOverride.done);
       setCancel(statusOverride.cancel);
    }
  }, [statusOverride]);`
);

// 8. Pass overrides from App.tsx rendering of TagmeRow
content = content.replace(
  /onStatusChange=\{handleStatusChange\} isSubscribed=\{isSubscribed\} onToggleSubscribe=\{\(\) => toggleSubscribe\(key\)\} \/>;/,
  `onStatusChange={handleStatusChange} isSubscribed={isSubscribed} onToggleSubscribe={() => toggleSubscribe(key)} priorityOverride={taskPriorities[key]} statusOverride={taskStatuses[key]} />;`
);

// 9. Analytics Dashboard calculation - Use overrides for accuracy
content = content.replace(
  /const priority = combined\.filter\(i => String\(i\.priority\) === 'true' \|\| i\.priority === true\)\.length;/,
  `const priority = combined.filter(i => {
      const key = i.uniqueKey || generateKey(i);
      if (taskPriorities && taskPriorities[key] !== undefined) return taskPriorities[key];
      return String(i.priority) === 'true' || i.priority === true;
    }).length;`
);

content = content.replace(
  /const completed = combined\.filter\(i => String\(i\.done\) === 'true' \|\| i\.done === true\)\.length;/,
  `const completed = combined.filter(i => {
      const key = i.uniqueKey || generateKey(i);
      if (taskStatuses && taskStatuses[key] !== undefined) return taskStatuses[key].done;
      return String(i.done) === 'true' || i.done === true;
    }).length;`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log("App.tsx patched successfully!");
