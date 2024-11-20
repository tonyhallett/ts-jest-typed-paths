import * as fs from 'fs';
const notJest = {
    mock<T>(arg1:string, arg2: T){}
}
notJest.mock<string>('module', 'module');
