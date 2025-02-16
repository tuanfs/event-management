export interface IUser {
    username: string;
    password: string;
    fullname: string;
    role: 'admin' | 'user';
}