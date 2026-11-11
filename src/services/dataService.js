import { supabase } from '../lib/supabase.js';

// Default empty workspace structure for any new user
const EMPTY_WORKSPACE = {
  lessons: [],
  classes: [],
  materials: [],
  assignments: [],
  lessonPlans: [],
  students: [],
  attendance: [],
};

// Helper to normalize and cross-link student records with classes
function normalizeWorkspace(ws) {
  if (!ws) return { ...EMPTY_WORKSPACE };
  const res = { ...EMPTY_WORKSPACE, ...ws };
  if (Array.isArray(res.lessons)) {
    // If a lesson is 09:30 - 10:30, snap it to 09:00 - 10:00 so it fits cleanly in the table cell
    res.lessons = res.lessons.map((l) => {
      const st = l.start_time || l.start;
      const et = l.end_time || l.end;
      if (st === '09:30' && et === '10:30') {
        return {
          ...l,
          start_time: '09:00',
          start: '09:00',
          end_time: '10:00',
          end: '10:00',
        };
      }
      return l;
    });
  }
  if (Array.isArray(res.students) && Array.isArray(res.classes)) {
    res.students = res.students.map((s) => {
      const sCid = String(s.class_id || '').toLowerCase().trim();
      const sGname = String(s.group_name || '').toLowerCase().trim();
      const cls = res.classes.find(
        (c) =>
          String(c.id).toLowerCase().trim() === sCid ||
          String(c.name || '').toLowerCase().trim() === sCid ||
          String(c.id).toLowerCase().trim() === sGname ||
          String(c.name || '').toLowerCase().trim() === sGname
      );
      if (cls) {
        return {
          ...s,
          class_id: cls.id,
          group_name: cls.name,
        };
      }
      return s;
    });
  }

  // Clean up any accidentally auto-propagated grades on dates where no attendance was marked (status is null for everyone)
  if (Array.isArray(res.attendance)) {
    res.attendance = res.attendance.map((att) => {
      if (att && att.records && typeof att.records === 'object') {
        const cleaned = { ...att.records };
        const hasAnyAttendance = Object.values(cleaned).some((r) => r && r.status);
        if (!hasAnyAttendance) {
          // If no student has attendance status on this date, grades should not be pre-filled
          let changed = false;
          Object.keys(cleaned).forEach((k) => {
            if (cleaned[k] && cleaned[k].grade) {
              cleaned[k] = { ...cleaned[k], grade: null };
              changed = true;
            }
          });
          if (changed) {
            return { ...att, records: cleaned };
          }
        }
      }
      return att;
    });
  }

  return res;
}

// Helper to get user-specific workspace data
async function getUserWorkspace(userId) {
  if (!userId) return { ...EMPTY_WORKSPACE };

  const storageKey = `darsplan_workspace_${userId}`;

  // 1. Try local storage cache for this specific user
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return normalizeWorkspace(parsed);
    }
  } catch (err) {
    console.warn('Local storage read warning:', err);
  }

  // 2. If not in local cache (e.g. new browser/device or after cache clear), fetch from Supabase Auth user metadata
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId && user.user_metadata?.darsplan_workspace) {
      const cloudData = user.user_metadata.darsplan_workspace;
      const merged = normalizeWorkspace(cloudData);
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

  async updateLesson(userId, lessonId, updates) {
    if (!userId || !lessonId) return null;
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', lessonId)
        .eq('user_id', userId)
        .select()
        .single();

      if (!error && data) {
        const ws = await getUserWorkspace(userId);
        ws.lessons = (ws.lessons || []).map((l) => (l.id === lessonId ? { ...l, ...data } : l));
        await saveUserWorkspace(userId, ws);
        return data;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    let updatedItem = null;
    ws.lessons = (ws.lessons || []).map((l) => {
      if (l.id === lessonId) {
        updatedItem = { ...l, ...updates };
        return updatedItem;
      }
      return l;
    });
    await saveUserWorkspace(userId, ws);
    return updatedItem;
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
    const ws = await getUserWorkspace(userId);

    const rawTarget = String(student.class_id || student.group_name || student.class_name || '').trim();
    const target = rawTarget.toLowerCase();
    const matchedCls = (ws.classes || []).find(
      (c) => String(c.id).toLowerCase().trim() === target || String(c.name || '').toLowerCase().trim() === target
    );
    const finalClassId = matchedCls ? matchedCls.id : (student.class_id || rawTarget);
    const finalGroupName = matchedCls ? matchedCls.name : (student.group_name || student.class_name || rawTarget);

    const newStudent = {
      id: crypto.randomUUID ? crypto.randomUUID() : `std_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      class_id: finalClassId,
      group_name: finalGroupName,
      name: student.name.trim(),
      phone: student.phone ? student.phone.trim() : '',
      parent_phone: student.parent_phone ? student.parent_phone.trim() : '',
      note: student.note ? student.note.trim() : '',
      fee: Number(student.fee || student.daromad) || 0,
      paid: Boolean(student.paid),
      grade: student.grade ? Number(student.grade) : null,
      grades: Array.isArray(student.grades)
        ? student.grades
        : student.grade
        ? [{ id: Date.now().toString(), grade: Number(student.grade), date: new Date().toLocaleDateString('uz-UZ') }]
        : [],
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('students')
        .insert([newStudent])
        .select()
        .single();
      if (!error && data) {
        // Also persist into local workspace
        ws.students = [...(ws.students || []), { ...newStudent, ...data }];
        await saveUserWorkspace(userId, ws);
        return { ...newStudent, ...data };
      }
    } catch {}

    ws.students = [...(ws.students || []), newStudent];
    // Sync class student count if class exists
    if (ws.classes && (matchedCls || rawTarget)) {
      const cls = matchedCls || ws.classes.find(
        (c) => c.id === finalClassId || c.name.toLowerCase().trim() === target
      );
      if (cls) {
        cls.student_count = ws.students.filter(
          (s) =>
            s.class_id === cls.id ||
            String(s.group_name || '').toLowerCase().trim() === cls.name.toLowerCase().trim()
        ).length;
      }
    }
    await saveUserWorkspace(userId, ws);
    return newStudent;
  },

  async updateStudent(userId, studentId, updates) {
    if (!userId || !studentId) return null;
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .eq('user_id', userId)
        .select()
        .single();
      if (!error && data) {
        const ws = await getUserWorkspace(userId);
        ws.students = (ws.students || []).map((s) => (s.id === studentId ? { ...s, ...data } : s));
        await saveUserWorkspace(userId, ws);
        return data;
      }
    } catch {}

    const ws = await getUserWorkspace(userId);
    let updatedStudent = null;
    ws.students = (ws.students || []).map((s) => {
      if (s.id === studentId) {
        updatedStudent = { ...s, ...updates };
        return updatedStudent;
      }
      return s;
    });
    await saveUserWorkspace(userId, ws);
    return updatedStudent;
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

  // ── ATTENDANCE (DAVOMAT VA BAHOLASH) ──
  async getAttendance(userId, classId, date, className = '') {
    if (!userId || !classId || !date) return null;
    const ws = await getUserWorkspace(userId);
    const list = ws.attendance || [];
    const targetId = String(classId).toLowerCase().trim();
    const targetName = String(className || '').toLowerCase().trim();

    const found = list.find((a) => {
      if (a.date !== date) return false;
      const aId = String(a.class_id || '').toLowerCase().trim();
      const aName = String(a.class_name || '').toLowerCase().trim();
      return (
        aId === targetId ||
        (targetName && aId === targetName) ||
        (targetName && aName === targetName) ||
        (targetId && aName === targetId)
      );
    });
    return found || null;
  },

  async saveAttendance(userId, classId, date, records, className = '') {
    if (!userId || !classId || !date) return false;
    const ws = await getUserWorkspace(userId);
    if (!ws.attendance) ws.attendance = [];

    const targetId = String(classId).toLowerCase().trim();
    const targetName = String(className || '').toLowerCase().trim();

    const existingIdx = ws.attendance.findIndex((a) => {
      if (a.date !== date) return false;
      const aId = String(a.class_id || '').toLowerCase().trim();
      const aName = String(a.class_name || '').toLowerCase().trim();
      return (
        aId === targetId ||
        (targetName && aId === targetName) ||
        (targetName && aName === targetName) ||
        (targetId && aName === targetId)
      );
    });

    const resolvedClassName =
      className ||
      ws.classes?.find(
        (c) => String(c.id) === String(classId) || c.name.toLowerCase().trim() === targetId
      )?.name ||
      String(classId);

    const payload = {
      id: existingIdx >= 0 ? ws.attendance[existingIdx].id : `att_${classId}_${date}`,
      class_id: classId,
      class_name: resolvedClassName,
      date: date,
      records: records || {}, // { [studentId]: { status: 'B'|'Y'|'K'|'S', grade: 2..5|null, comment: string } }
      updated_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      ws.attendance[existingIdx] = payload;
    } else {
      ws.attendance.push(payload);
    }

    // Also sync latest grades back to students
    if (records && ws.students) {
      Object.entries(records).forEach(([stdId, rec]) => {
        if (rec && rec.grade) {
          const std = ws.students.find((s) => s.id === stdId);
          if (std) {
            std.grade = Number(rec.grade);
          }
        }
      });
    }

    await saveUserWorkspace(userId, ws);
    return payload;
  },

  async getAllAttendance(userId) {
    if (!userId) return [];
    const ws = await getUserWorkspace(userId);
    return ws.attendance || [];
  },
};
