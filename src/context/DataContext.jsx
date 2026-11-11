import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { dataService } from '../services/dataService';

const DataContext = createContext({
  lessons: [],
  classes: [],
  materials: [],
  assignments: [],
  lessonPlans: [],
  students: [],
  loadingData: true,
  addLesson: async () => {},
  deleteLesson: async () => {},
  addClass: async () => {},
  deleteClass: async () => {},
  addMaterial: async () => {},
  deleteMaterial: async () => {},
  addAssignment: async () => {},
  deleteAssignment: async () => {},
  addLessonPlan: async () => {},
  deleteLessonPlan: async () => {},
  addStudent: async () => {},
  updateStudent: async () => {},
  deleteStudent: async () => {},
  refreshData: async () => {},
});

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [classes, setClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadUserData = useCallback(async (userId) => {
    if (!userId) {
      setLessons([]);
      setClasses([]);
      setMaterials([]);
      setAssignments([]);
      setLessonPlans([]);
      setStudents([]);
      setAttendanceList([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      const [l, c, m, a, p, s, att] = await Promise.all([
        dataService.getLessons(userId),
        dataService.getClasses(userId),
        dataService.getMaterials(userId),
        dataService.getAssignments(userId),
        dataService.getLessonPlans(userId),
        dataService.getStudents(userId),
        dataService.getAllAttendance(userId),
      ]);
      setLessons(l || []);
      setClasses(c || []);
      setMaterials(m || []);
      setAssignments(a || []);
      setLessonPlans(p || []);
      setStudents(s || []);
      setAttendanceList(att || []);
    } catch (err) {
      console.error('Error loading user data:', err);
      setLessons([]);
      setClasses([]);
      setMaterials([]);
      setAssignments([]);
      setLessonPlans([]);
      setStudents([]);
      setAttendanceList([]);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // When user changes (login, logout, account switch), cleanly load or reset
  useEffect(() => {
    if (user?.id) {
      loadUserData(user.id);
    } else {
      setLessons([]);
      setClasses([]);
      setMaterials([]);
      setAssignments([]);
      setLessonPlans([]);
      setStudents([]);
      setAttendanceList([]);
      setLoadingData(false);
    }
  }, [user?.id, loadUserData]);

  const addLesson = async (lessonData) => {
    if (!user?.id) return;
    const created = await dataService.addLesson(user.id, lessonData);
    if (created) {
      setLessons((prev) => [...prev, created]);
      // If the lesson specifies a class/group, ensure it exists in classes list
      if (created.class_name && created.class_name.trim()) {
        const clsName = created.class_name.trim();
        setClasses((prev) => {
          const exists = prev.some(
            (c) => c.name.toLowerCase().trim() === clsName.toLowerCase()
          );
          if (!exists) {
            return [
              ...prev,
              {
                id: `class_${Date.now()}`,
                user_id: user.id,
                name: clsName,
                room: '',
                student_count: 0,
              },
            ];
          }
          return prev;
        });
      }
    }
    return created;
  };

  const deleteLesson = async (lessonId) => {
    if (!user?.id) return;
    const ok = await dataService.deleteLesson(user.id, lessonId);
    if (ok) {
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    }
    return ok;
  };

  const updateLesson = async (lessonId, updates) => {
    if (!user?.id) return;
    const updated = await dataService.updateLesson(user.id, lessonId, updates);
    if (updated) {
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, ...updated } : l))
      );
    }
    return updated;
  };

  const addClass = async (classData) => {
    if (!user?.id) return;
    const created = await dataService.addClass(user.id, classData);
    if (created) {
      setClasses((prev) => [...prev, created]);
    }
    return created;
  };

  const deleteClass = async (classId) => {
    if (!user?.id) return;
    const ok = await dataService.deleteClass(user.id, classId);
    if (ok) {
      setClasses((prev) => prev.filter((c) => c.id !== classId));
    }
    return ok;
  };

  const addMaterial = async (matData) => {
    if (!user?.id) return;
    const created = await dataService.addMaterial(user.id, matData);
    if (created) {
      setMaterials((prev) => [created, ...prev]);
    }
    return created;
  };

  const deleteMaterial = async (materialId) => {
    if (!user?.id) return;
    const ok = await dataService.deleteMaterial(user.id, materialId);
    if (ok) {
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    }
    return ok;
  };

  const addAssignment = async (asgData) => {
    if (!user?.id) return;
    const created = await dataService.addAssignment(user.id, asgData);
    if (created) {
      setAssignments((prev) => [...prev, created]);
    }
    return created;
  };

  const deleteAssignment = async (assignmentId) => {
    if (!user?.id) return;
    const ok = await dataService.deleteAssignment(user.id, assignmentId);
    if (ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    }
    return ok;
  };

  const addLessonPlan = async (planData) => {
    if (!user?.id) return;
    const created = await dataService.addLessonPlan(user.id, planData);
    if (created) {
      setLessonPlans((prev) => [created, ...prev]);
    }
    return created;
  };

  const deleteLessonPlan = async (planId) => {
    if (!user?.id) return;
    const ok = await dataService.deleteLessonPlan(user.id, planId);
    if (ok) {
      setLessonPlans((prev) => prev.filter((p) => p.id !== planId));
    }
    return ok;
  };

  const addStudent = async (studentData) => {
    if (!user?.id) return;
    const created = await dataService.addStudent(user.id, studentData);
    if (created) {
      setStudents((prev) => [...prev, created]);
      // Update local class count
      if (studentData.class_id) {
        setClasses((prev) =>
          prev.map((c) =>
            c.id === studentData.class_id
              ? { ...c, student_count: (c.student_count || 0) + 1 }
              : c
          )
        );
      }
    }
    return created;
  };

  const updateStudent = async (studentId, updates) => {
    if (!user?.id || !studentId) return null;
    const updated = await dataService.updateStudent(user.id, studentId, updates);
    if (updated) {
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, ...updated } : s))
      );
    }
    return updated;
  };

  const deleteStudent = async (studentId) => {
    if (!user?.id) return;
    const toDelete = students.find((s) => s.id === studentId);
    const ok = await dataService.deleteStudent(user.id, studentId);
    if (ok) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      if (toDelete?.class_id) {
        setClasses((prev) =>
          prev.map((c) =>
            c.id === toDelete.class_id
              ? { ...c, student_count: Math.max((c.student_count || 1) - 1, 0) }
              : c
          )
        );
      }
    }
    return ok;
  };

  const getAttendance = async (classId, date, className = '') => {
    if (!user?.id) return null;
    return await dataService.getAttendance(user.id, classId, date, className);
  };

  const saveAttendance = async (classId, date, records, className = '') => {
    if (!user?.id) return false;
    const res = await dataService.saveAttendance(user.id, classId, date, records, className);
    if (res) {
      setAttendanceList((prev) => {
        const idx = prev.findIndex(
          (a) => a.id === res.id || (String(a.class_id) === String(classId) && a.date === date)
        );
        if (idx >= 0) {
          const cp = [...prev];
          cp[idx] = res;
          return cp;
        }
        return [...prev, res];
      });

      if (records) {
        // Sync in-memory student grades
        setStudents((prev) =>
          prev.map((s) => {
            if (records[s.id] && records[s.id].grade) {
              return { ...s, grade: Number(records[s.id].grade) };
            }
            return s;
          })
        );
      }
    }
    return res;
  };

  const refreshData = () => {
    if (user?.id) {
      return loadUserData(user.id);
    }
  };

  const value = {
    lessons,
    classes,
    materials,
    assignments,
    lessonPlans,
    students,
    attendanceList,
    loadingData,
    addLesson,
    updateLesson,
    deleteLesson,
    addClass,
    deleteClass,
    addMaterial,
    deleteMaterial,
    addAssignment,
    deleteAssignment,
    addLessonPlan,
    deleteLessonPlan,
    addStudent,
    updateStudent,
    deleteStudent,
    getAttendance,
    saveAttendance,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
