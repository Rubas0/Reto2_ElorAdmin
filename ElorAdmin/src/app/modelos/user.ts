export interface User {
  id: number;
  username: string;
  nombre: string;
  apellidos: string;
  rol: RoleType; // god | admin | profesor | alumno
}

export type RoleType = 'god' | 'admin' | 'profesor' | 'alumno';