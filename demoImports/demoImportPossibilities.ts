type X = typeof import("./demoExport");
type Y = import("./demoExport").IFace;
type Z = typeof import("./demoExport").value;
import type { value } from "./demoExport";
import type { default as DefaultValue } from "./demoExport";
import type { IFace } from "./demoExport";
import { IFace as IFace2 } from "./demoExport";
import * as DemoExport from "./demoExport";
import DemoExportDefault from "./demoExport";
import demoExportEquals = require("./demoExport");
// namespace
const d = require("./demoExport");

function genericFn<T>() {}

genericFn<X>();
genericFn<typeof value>();

genericFn<demoExportEquals.IFace>();
genericFn<typeof d>();

genericFn<typeof import("./demoExport")>();
genericFn<typeof import("./demoExport").value>();
genericFn<typeof import("./demoExport").default>();

genericFn<import("./demoExport").IFace>();
