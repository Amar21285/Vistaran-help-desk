import { User, Ticket, Status, Role, Technician, Symptom, UserStatus, Priority } from '../types';

export const initialUsers: User[] = [
  {
    id: 'user-1',
    name: 'Alice Johnson',
    email: 'alice.j@vistaran.in',
    password: 'password123',
    role: Role.USER,
    department: 'Marketing',
    photo: 'https://i.pravatar.cc/150?u=alice.j@vistaran.in',
    status: UserStatus.ACTIVE,
    joinedDate: new Date().toISOString(),
  },
  {
    id: 'user-2',
    name: 'Bob Williams',
    email: 'bob.w@vistaran.in',
    password: 'password123',
    role: Role.USER,
    department: 'Sales',
    photo: 'https://i.pravatar.cc/150?u=bob.w@vistaran.in',
    status: UserStatus.ACTIVE,
    joinedDate: new Date().toISOString(),
  },
  {
    id: 'tech-1',
    name: 'Charlie Brown',
    email: 'charlie.b@vistaran.in',
    password: 'password123',
    role: Role.TECHNICIAN,
    department: 'IT Support',
    photo: 'https://i.pravatar.cc/150?u=charlie.b@vistaran.in',
    status: UserStatus.ACTIVE,
    joinedDate: new Date().toISOString(),
  },
  {
    id: 'tech-2',
    name: 'Diana Prince',
    email: 'diana.p@vistaran.in',
    password: 'password123',
    role: Role.TECHNICIAN,
    department: 'IT Support',
    photo: 'https://i.pravatar.cc/150?u=diana.p@vistaran.in',
    status: UserStatus.ACTIVE,
    joinedDate: new Date().toISOString(),
  },
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'ITsupport@vistaran.in',
    password: 'password123',
    role: Role.ADMIN,
    department: 'Administration',
    photo: 'https://i.pravatar.cc/150?u=ITsupport@vistaran.in',
    status: UserStatus.ACTIVE,
    joinedDate: new Date().toISOString(),
  },
];

export const initialTechnicians: Technician[] = initialUsers
  .filter(user => user.role === Role.TECHNICIAN)
  .map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    phone: user.phone,
    whatsapp: user.whatsapp
  }));

export const initialTickets: Ticket[] = [
  {
    id: 'ticket-1',
    userId: 'user-1',
    email: 'alice.j@vistaran.in',
    department: 'Marketing',
    description: 'My VPN client is showing an error and I cannot connect to the office network from home.',
    status: Status.OPEN,
    dateCreated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    dateResolved: null,
    assignedTechId: null,
    symptomId: 'symptom-1',
    priority: Priority.MEDIUM,
    notes: '',
  },
  {
    id: 'ticket-2',
    userId: 'user-2',
    email: 'bob.w@vistaran.in',
    department: 'Sales',
    description: 'The main office printer on the 2nd floor is not printing. It says "Paper Jam" but there is no paper jam.',
    status: Status.IN_PROGRESS,
    dateCreated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    dateResolved: null,
    assignedTechId: 'tech-1',
    symptomId: 'symptom-2',
    priority: Priority.HIGH,
    notes: 'Checked the printer, it seems to be a sensor issue. Ordering a replacement part.',
  },
  {
    id: 'ticket-3',
    userId: 'user-1',
    email: 'alice.j@vistaran.in',
    department: 'Marketing',
    description: 'I need Adobe Photoshop installed on my machine for a new project.',
    status: Status.RESOLVED,
    dateCreated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    dateResolved: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    assignedTechId: 'tech-2',
    symptomId: 'symptom-3',
    priority: Priority.LOW,
    notes: 'License procured and software installed remotely. User confirmed functionality.',
  },
];

export const initialSymptoms: Symptom[] = [
    { id: 'symptom-1', name: 'Cannot connect to VPN', department: 'Marketing' },
    { id: 'symptom-2', name: 'Printer not working', department: 'Sales' },
    { id: 'symptom-3', name: 'Software installation request', department: 'Marketing' },
    { id: 'symptom-4', name: 'Slow computer performance', department: 'IT' },
    { id: 'symptom-5', name: 'Password reset', department: 'IT' },
    { id: 'symptom-6', name: 'Email issues', department: 'IT' },
    { id: 'symptom-7', name: 'Hardware malfunction', department: 'IT' },
];
