import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { dataService } from '../services/dataService';

const DataContext = createContext({
  lessons: [],
  classes: [],
  materials: [],
  assignments: [],
  lessonPlans: [],
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
  refreshData: async () => {},
});

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [classes, setClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const loadUserData = useCallback(async (userId) => {
    if (!userId) {
      setLessons([]);
      setClasses([]);
      setMaterials([]);
      setAssignments([]);
      setLessonPlans([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      const [l, c, m, a, p] = await Promise.all([
        dataService.getLessons(userId),
        dataService.getClasses(userId),
        dataService.getMaterials(userId),
        dataService.getAssignments(userId),
        dataService.getLessonPlans(userId),
      ]);
      setLessons(l || []);
      setClasses(c || []);
      setMaterials(m || []);
      setAssignments(a || []);
      setLessonPlans(p || []);
    } catch (err) {
      console.error('Error loading user data:', err);
      setLessons([]);
      setClasses([]);
      setMaterials([]);
      setAssignments([]);
      setLessonPlans([]);
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
      setLoadingData(false);
    }
  }, [user?.id, loadUserData]);

  const addLesson = async (lessonData) => {
    if (!user?.id) return;
    const created = await dataService.addLesson(user.id, lessonData);
    if (created) {
      setLessons((prev) => [...prev, created]);
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
    loadingData,
    addLesson,
    deleteLesson,
    addClass,
    deleteClass,
    addMaterial,
    deleteMaterial,
    addAssignment,
    deleteAssignment,
    addLessonPlan,
    deleteLessonPlan,
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
