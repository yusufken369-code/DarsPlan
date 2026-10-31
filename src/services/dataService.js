import { supabase } from '../lib/supabase.js';

// Default empty workspace structure for any new user
const EMPTY_WORKSPACE = {
  lessons: [],
  classes: [],
  materials: [],
  assignments: [],
  lessonPlans: [],
  students: [],
};

// Helper to get user-specific workspace data
async function getUserWorkspace(userId) {
  if (!userId) return { ...EMPTY_WORKSPACE };

  const storageKey = `darsplan_workspace_${userId}`;

  // 1. Try local storage cache for this specific user
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...EMPTY_WORKSPACE, ...parsed };
    }
  } catch (err) {
    console.warn('Local storage read warning:', err);
  }

  // 2. If not in local cache (e.g. new browser/device or after cache clear), fetch from Supabase Auth user metadata
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId && user.user_metadata?.darsplan_workspace) {
      const cloudData = user.user_metadata.darsplan_workspace;
      const merged = { ...EMPTY_WORKSPACE, ...cloudData };
      // Cache locally for fast subsequent reads
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (err) {
    console.warn('Supabase metadata fetch warning:', err);
  }

  return { ...EMPTY_WORKSPACE };
}

// Helper to save user-specific workspace data
async function saveUserWorkspace(userId, data) {
  if (!userId) return;
  const storageKey = `darsplan_workspace_${userId}`;

  // 1. Save to local storage for immediate persistence
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (err) {
    console.error('Local storage write error:', err);
  }

  // 2. Persist to Supabase user metadata (cloud backup per user)
  try {
    await supabase.auth.updateUser({
      data: { darsplan_workspace: data },
    });
  } catch (err) {
    console.warn('Supabase cloud backup sync warning:', err);
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
    } catch {}

    const ws = await getUserWorkspace(userId);
    return ws.lessons || [];
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
      created_at: new Date().toISOString(),
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
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.lessons = [...(ws.lessons || []), newLesson];

    // Ensure group/class exists in classes list
    if (newLesson.class_name && ws.classes) {
      const exists = ws.classes.some(
        (c) => c.name.toLowerCase().trim() === newLesson.class_name.toLowerCase().trim()
      );
      if (!exists) {
        ws.classes.push({
          id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          user_id: userId,
          name: newLesson.class_name.trim(),
          room: '',
          student_count: 0,
          created_at: new Date().toISOString(),
        });
      }
    }

    await saveUserWorkspace(userId, ws);
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
        const ws = await getUserWorkspace(userId);
        ws.lessons = (ws.lessons || []).filter((l) => l.id !== lessonId);
        await saveUserWorkspace(userId, ws);
        return true;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.lessons = (ws.lessons || []).filter((l) => l.id !== lessonId);
    await saveUserWorkspace(userId, ws);
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
    } catch {}

    const ws = await getUserWorkspace(userId);
    return ws.classes || [];
  },

  async addClass(userId, classItem) {
    if (!userId) return null;
    const newClass = {
      id: crypto.randomUUID ? crypto.randomUUID() : `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      name: classItem.name,
      student_count: Number(classItem.student_count) || 0,
      room: classItem.room || '',
      created_at: new Date().toISOString(),
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
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.classes = [...(ws.classes || []), newClass];
    await saveUserWorkspace(userId, ws);
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
        const ws = await getUserWorkspace(userId);
        ws.classes = (ws.classes || []).filter((c) => c.id !== classId);
        await saveUserWorkspace(userId, ws);
        return true;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.classes = (ws.classes || []).filter((c) => c.id !== classId);
    await saveUserWorkspace(userId, ws);
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
    } catch {}

    const ws = await getUserWorkspace(userId);
    return ws.materials || [];
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
      created_at: new Date().toISOString(),
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
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.materials = [newMaterial, ...(ws.materials || [])];
    await saveUserWorkspace(userId, ws);
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
        const ws = await getUserWorkspace(userId);
        ws.materials = (ws.materials || []).filter((m) => m.id !== materialId);
        await saveUserWorkspace(userId, ws);
        return true;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.materials = (ws.materials || []).filter((m) => m.id !== materialId);
    await saveUserWorkspace(userId, ws);
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
    } catch {}

    const ws = await getUserWorkspace(userId);
    return ws.assignments || [];
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
      created_at: new Date().toISOString(),
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
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.assignments = [...(ws.assignments || []), newAssignment];
    await saveUserWorkspace(userId, ws);
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
        const ws = await getUserWorkspace(userId);
        ws.assignments = (ws.assignments || []).filter((a) => a.id !== assignmentId);
        await saveUserWorkspace(userId, ws);
        return true;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.assignments = (ws.assignments || []).filter((a) => a.id !== assignmentId);
    await saveUserWorkspace(userId, ws);
    return true;
  },

  // ── LESSON PLANS (Dars rejalari) ──
  async getLessonPlans(userId) {
    if (!userId) return [];
    const ws = await getUserWorkspace(userId);
    return ws.lessonPlans || [];
  },

  async addLessonPlan(userId, plan) {
    if (!userId) return null;
    const newPlan = {
      id: crypto.randomUUID ? crypto.randomUUID() : `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      subject: plan.subject,
      class_name: plan.class_name || '',
      topic: plan.topic,
      objective: plan.objective || '',
      date: plan.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    const ws = await getUserWorkspace(userId);
    ws.lessonPlans = [newPlan, ...(ws.lessonPlans || [])];
    await saveUserWorkspace(userId, ws);
    return newPlan;
  },

  async deleteLessonPlan(userId, planId) {
    if (!userId || !planId) return false;
    const ws = await getUserWorkspace(userId);
    ws.lessonPlans = (ws.lessonPlans || []).filter((p) => p.id !== planId);
    await saveUserWorkspace(userId, ws);
    return true;
  },

  // ── STUDENTS (O'quvchilar) ──
  async getStudents(userId, classId = null) {
    if (!userId) return [];
    try {
      let query = supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });
      if (classId) {
        query = query.or(`class_id.eq.${classId},group_name.eq.${classId}`);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    const list = ws.students || [];
    if (!classId) return list;
    const target = String(classId).toLowerCase().trim();
    return list.filter(
      (s) =>
        String(s.class_id || '').toLowerCase().trim() === target ||
        String(s.group_name || '').toLowerCase().trim() === target
    );
  },

  async addStudent(userId, student) {
    if (!userId || !student.name) return null;
    const groupVal = student.group_name || student.class_name || student.class_id || '';
    const newStudent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `std_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      class_id: student.class_id || groupVal,
      group_name: groupVal,
      name: student.name.trim(),
      phone: student.phone ? student.phone.trim() : '',
      parent_phone: student.parent_phone ? student.parent_phone.trim() : '',
      note: student.note ? student.note.trim() : '',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('students')
        .insert([newStudent])
        .select()
        .single();
      if (!error && data) {
        return data;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    ws.students = [...(ws.students || []), newStudent];
    // Sync class student count if class exists
    if (ws.classes && groupVal) {
      const target = groupVal.toLowerCase().trim();
      const cls = ws.classes.find(
        (c) => c.id === groupVal || c.name.toLowerCase().trim() === target
      );
      if (cls) {
        cls.student_count = ws.students.filter(
          (s) =>
            s.class_id === cls.id ||
            String(s.group_name || '').toLowerCase().trim() === target
        ).length;
      }
    }
    await saveUserWorkspace(userId, ws);
    return newStudent;
  },

  async deleteStudent(userId, studentId) {
    if (!userId || !studentId) return false;
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('user_id', userId);
      if (!error) {
        const ws = await getUserWorkspace(userId);
        const toDelete = (ws.students || []).find((s) => s.id === studentId);
        ws.students = (ws.students || []).filter((s) => s.id !== studentId);
        if (toDelete?.class_id && ws.classes) {
          const cls = ws.classes.find((c) => c.id === toDelete.class_id);
          if (cls) {
            cls.student_count = ws.students.filter((s) => s.class_id === toDelete.class_id).length;
          }
        }
        await saveUserWorkspace(userId, ws);
        return true;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    const toDelete = (ws.students || []).find((s) => s.id === studentId);
    ws.students = (ws.students || []).filter((s) => s.id !== studentId);
    if (toDelete?.class_id && ws.classes) {
      const cls = ws.classes.find((c) => c.id === toDelete.class_id);
      if (cls) {
        cls.student_count = ws.students.filter((s) => s.class_id === toDelete.class_id).length;
      }
    }
    await saveUserWorkspace(userId, ws);
    return true;
  },
};
