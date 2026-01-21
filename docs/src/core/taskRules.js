/**
 * Check if a task can be edited
 */
export function canEditTask(task) {
  if (!task) return false;
  return task.archived !== true;
}

/**
 * Mark task as completed
 */
export function completeTask(task) {
  return {
    ...task,
    completed: true,
    updatedAt: Date.now()
  };
}

/**
 * Archive task instead of deleting
 */
export function archiveTask(task) {
  return {
    ...task,
    archived: true,
    updatedAt: Date.now()
  };
}
