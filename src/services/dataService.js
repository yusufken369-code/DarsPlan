import { supabase } from '../lib/supabase.js';

// Helper to get fallback data from localStorage / metadata
function getLocalUserData(userId) {
  if (!userId) return { lessons: [], classes: [], materials: [], assignments: [] };
  try {
    const raw = localStorage.getItem(`darsplan_workspace_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local user data:', err);
  }
  return { lessons: [], classes: [], materials: [], assignments: [] };
}

function saveLocalUserData(userId, data) {
  if (!userId) return;
  try {
    localStorage.setItem(`darsplan_workspace_${userId}`, JSON.stringify(data));
    // Asynchronously sync to Supabase user metadata as cloud backup
    supabase.auth.updateUser({
      data: { darsplan_workspace: data }
    }).catch(err => console.warn('Supabase metadata backup failed:', err));
  } catch (err) {
    console.error('Error saving local user data:', err);
  }
}

export const dataService = {
  // ── LESSONS ──
  async getLessons(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch {
      // Table doesn't exist yet, fallback
    }

    const local = getLocalUserData(userId);
    return local.lessons || [];
  },

  async addLesson(userId, lesson) {
    if (!userId) return null;
    const newLesson = {
      id: crypto.randomUUID ? crypto.randomUUID() : `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      subject: lesson.subject,
      class_name: lesson.class_name || lesson.cls || '',
      schedule_type: lesson.schedule_type || (lesson.specific_date ? 'date' : 'weekly'),
      day: Number(lesson.day ?? 0),
      specific_date: lesson.specific_date || null,
      start_time: lesson.start_time || lesson.start || '08:00',
      end_time: lesson.end_time || lesson.end || '09:00',
      color: lesson.color || 'navy',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([newLesson])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    local.lessons = [...(local.lessons || []), newLesson];
    saveLocalUserData(userId, local);
    return newLesson;
  },

  async deleteLesson(userId, lessonId) {
    if (!userId || !lessonId) return false;
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .eq('user_id', userId);

      if (!error) {
        // also sync local
        const local = getLocalUserData(userId);
        local.lessons = (local.lessons || []).filter(l => l.id !== lessonId);
        saveLocalUserData(userId, local);
        return true;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    local.lessons = (local.lessons || []).filter(l => l.id !== lessonId);
    saveLocalUserData(userId, local);
    return true;
  },

  // ── CLASSES ──
  async getClasses(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    return local.classes || [];
  },

  async addClass(userId, classItem) {
    if (!userId) return null;
    const newClass = {
      id: crypto.randomUUID ? crypto.randomUUID() : `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      name: classItem.name,
      student_count: Number(classItem.student_count) || 0,
      room: classItem.room || '',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([newClass])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    local.classes = [...(local.classes || []), newClass];
    saveLocalUserData(userId, local);
    return newClass;
  },

  async deleteClass(userId, classId) {
    if (!userId || !classId) return false;
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('user_id', userId);

      if (!error) {
        const local = getLocalUserData(userId);
        local.classes = (local.classes || []).filter(c => c.id !== classId);
        saveLocalUserData(userId, local);
        return true;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    local.classes = (local.classes || []).filter(c => c.id !== classId);
    saveLocalUserData(userId, local);
    return true;
  },

  // ── MATERIALS ──
  async getMaterials(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    return local.materials || [];
  },

  async addMaterial(userId, material) {
    if (!userId) return null;
    const newMaterial = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      subject: material.subject,
      title: material.title,
      type: material.type || 'PDF',
      file_url: material.file_url || '',
      date: material.date || new Date().toLocaleDateString('uz-UZ'),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('materials')
        .insert([newMaterial])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    local.materials = [newMaterial, ...(local.materials || [])];
    saveLocalUserData(userId, local);
    return newMaterial;
  },

  async deleteMaterial(userId, materialId) {
    if (!userId || !materialId) return false;
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId)
        .eq('user_id', userId);

      if (!error) {
        const local = getLocalUserData(userId);
        local.materials = (local.materials || []).filter(m => m.id !== materialId);
        saveLocalUserData(userId, local);
        return true;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    local.materials = (local.materials || []).filter(m => m.id !== materialId);
    saveLocalUserData(userId, local);
    return true;
  },

  // ── ASSIGNMENTS / DEADLINES ──
  async getAssignments(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    return local.assignments || [];
  },

  async addAssignment(userId, assignment) {
    if (!userId) return null;
    const newAssignment = {
      id: crypto.randomUUID ? crypto.randomUUID() : `asg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      subject: assignment.subject,
      title: assignment.title || assignment.desc || '',
      type: assignment.type || 'test',
      due_date: assignment.due_date || new Date().toISOString().split('T')[0],
      due_time: assignment.due_time || '12:00',
      completed: false,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert([newAssignment])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    local.assignments = [...(local.assignments || []), newAssignment];
    saveLocalUserData(userId, local);
    return newAssignment;
  },

  async deleteAssignment(userId, assignmentId) {
    if (!userId || !assignmentId) return false;
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)
        .eq('user_id', userId);

      if (!error) {
        const local = getLocalUserData(userId);
        local.assignments = (local.assignments || []).filter(a => a.id !== assignmentId);
        saveLocalUserData(userId, local);
        return true;
      }
    } catch {
      // fallback
    }

    const local = getLocalUserData(userId);
    local.assignments = (local.assignments || []).filter(a => a.id !== assignmentId);
    saveLocalUserData(userId, local);
    return true;
  }
};
