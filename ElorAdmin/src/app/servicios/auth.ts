import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn = false;
  private _user: any = null;

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    // Simulate an HTTP POST request to authenticate the user
    return this.http.post<any>('http://localhost:3000/api/login', { username: username, password: password });

  }

  setLoggedIn(user: any) {
    this._isLoggedIn = true;
    this._user = user;
  }

  logout() {
    this._isLoggedIn = false;
    this._user = null;
  }

  isAuthenticated(): boolean {
    return this._isLoggedIn;
  }
}