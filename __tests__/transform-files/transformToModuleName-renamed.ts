import {transformToModuleName as t} from "ts-jest-typed-paths";
import { AClass } from "../imported/exporting";
jest.mock(t<AClass>());

