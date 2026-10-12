'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEMO_ASSIGNMENTS,
  DEMO_ATTENDANCE,
  DEMO_FEES,
  DEMO_NOTICES,
  DEMO_STUDENTS,
  type AssignmentRecord,
  type AttendanceSession,
  type AttendanceStatus,
  type FeeRecord,
  type NoticeRecord,
  type StudentRecord,
} from './demo-data'

type ActivityEntry = {
  id: string
  action: string
  detail: string
  at: string
}

export type WorkspaceSnapshot = {
  students: StudentRecord[]
  attendanceSessions: AttendanceSession[]
  assignments: AssignmentRecord[]
  notices: NoticeRecord[]
  fees: FeeRecord[]
}

type EduState = {
  students: StudentRecord[]
  attendanceSessions: AttendanceSession[]
  assignments: AssignmentRecord[]
  notices: NoticeRecord[]
  fees: FeeRecord[]
  activity: ActivityEntry[]
  addStudent: (student: Omit<StudentRecord, 'id'>) => void
  updateStudent: (id: string, patch: Partial<StudentRecord>) => void
  removeStudent: (id: string) => void
  saveAttendance: (course: string, date: string, records: Record<string, AttendanceStatus>) => void
  addAssignment: (assignment: Omit<AssignmentRecord, 'id' | 'submissions'>) => void
  publishNotice: (notice: Omit<NoticeRecord, 'id' | 'views' | 'publishedAt'>) => void
  toggleNoticePin: (id: string) => void
  markFeePaid: (id: string, method?: string) => void
  restoreSnapshot: (snapshot: WorkspaceSnapshot) => void
  resetDemo: () => void
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value))

function activity(action: string, detail: string): ActivityEntry {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    detail,
    at: new Date().toISOString(),
  }
}

export const useEduStore = create<EduState>()(
  persist(
    (set) => ({
      students: clone(DEMO_STUDENTS),
      attendanceSessions: clone(DEMO_ATTENDANCE),
      assignments: clone(DEMO_ASSIGNMENTS),
      notices: clone(DEMO_NOTICES),
      fees: clone(DEMO_FEES),
      activity: [
        activity('Demo workspace ready', 'EDU_ONE local-first data store initialized'),
      ],

      addStudent: (student) =>
        set((state) => {
          const next: StudentRecord = {
            ...student,
            id: `student-${Date.now()}`,
          }
          return {
            students: [next, ...state.students],
            activity: [activity('Student added', `${next.name} • ${next.regNo}`), ...state.activity].slice(0, 50),
          }
        }),

      updateStudent: (id, patch) =>
        set((state) => {
          const target = state.students.find((item) => item.id === id)
          return {
            students: state.students.map((item) => (item.id === id ? { ...item, ...patch } : item)),
            activity: target
              ? [activity('Student updated', target.name), ...state.activity].slice(0, 50)
              : state.activity,
          }
        }),

      removeStudent: (id) =>
        set((state) => {
          const target = state.students.find((item) => item.id === id)
          return {
            students: state.students.filter((item) => item.id !== id),
            activity: target
              ? [activity('Student removed', `${target.name} • ${target.regNo}`), ...state.activity].slice(0, 50)
              : state.activity,
          }
        }),

      saveAttendance: (course, date, records) =>
        set((state) => {
          const existing = state.attendanceSessions.find(
            (item) => item.course === course && item.date === date
          )
          const nextSession: AttendanceSession = {
            id: existing?.id ?? `attendance-${Date.now()}`,
            course,
            date,
            records,
          }
          const attendanceSessions = existing
            ? state.attendanceSessions.map((item) => (item.id === existing.id ? nextSession : item))
            : [nextSession, ...state.attendanceSessions]

          const students = state.students.map((student) => {
            const statuses = attendanceSessions
              .map((session) => session.records[student.id])
              .filter(Boolean)
            if (!statuses.length) return student
            const earned = statuses.reduce((sum, status) => {
              if (status === 'present' || status === 'excused') return sum + 1
              if (status === 'late') return sum + 0.8
              return sum
            }, 0)
            return {
              ...student,
              attendance: Math.round((earned / statuses.length) * 100),
            }
          })

          return {
            attendanceSessions,
            students,
            activity: [activity('Attendance saved', `${course} • ${date}`), ...state.activity].slice(0, 50),
          }
        }),

      addAssignment: (assignment) =>
        set((state) => {
          const next: AssignmentRecord = {
            ...assignment,
            id: `assignment-${Date.now()}`,
            submissions: 0,
          }
          return {
            assignments: [next, ...state.assignments],
            activity: [activity('Assignment created', next.title), ...state.activity].slice(0, 50),
          }
        }),

      publishNotice: (notice) =>
        set((state) => {
          const next: NoticeRecord = {
            ...notice,
            id: `notice-${Date.now()}`,
            publishedAt: new Date().toISOString(),
            views: 0,
          }
          return {
            notices: [next, ...state.notices],
            activity: [activity('Notice published', next.title), ...state.activity].slice(0, 50),
          }
        }),

      toggleNoticePin: (id) =>
        set((state) => ({
          notices: state.notices.map((item) =>
            item.id === id ? { ...item, pinned: !item.pinned } : item
          ),
        })),

      markFeePaid: (id, method = 'Demo Payment') =>
        set((state) => {
          const target = state.fees.find((item) => item.id === id)
          return {
            fees: state.fees.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: 'paid',
                    paidDate: new Date().toISOString().slice(0, 10),
                    method,
                  }
                : item
            ),
            activity: target
              ? [activity('Fee marked paid', `${target.feeType} • ₹${target.amount.toLocaleString('en-IN')}`), ...state.activity].slice(0, 50)
              : state.activity,
          }
        }),

      restoreSnapshot: (snapshot) =>
        set((state) => ({
          students: clone(snapshot.students),
          attendanceSessions: clone(snapshot.attendanceSessions),
          assignments: clone(snapshot.assignments),
          notices: clone(snapshot.notices),
          fees: clone(snapshot.fees),
          activity: [activity('Workspace restored', 'Imported an EDU_ONE JSON snapshot'), ...state.activity].slice(0, 50),
        })),

      resetDemo: () =>
        set({
          students: clone(DEMO_STUDENTS),
          attendanceSessions: clone(DEMO_ATTENDANCE),
          assignments: clone(DEMO_ASSIGNMENTS),
          notices: clone(DEMO_NOTICES),
          fees: clone(DEMO_FEES),
          activity: [activity('Demo data reset', 'Restored the default EDU_ONE workspace')],
        }),
    }),
    {
      name: 'eduone-workspace-v2',
      version: 2,
      partialize: (state) => ({
        students: state.students,
        attendanceSessions: state.attendanceSessions,
        assignments: state.assignments,
        notices: state.notices,
        fees: state.fees,
        activity: state.activity,
      }),
    }
  )
)
