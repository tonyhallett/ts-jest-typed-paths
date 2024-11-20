jest.autoMockOff().mock<typeof import("../imported/exporting")>("", () => {
    return {
        thing:{},
        AClass: class {},
    };
}).setMock<typeof import("../imported/exporting")>("", 
    {
        thing:{},
        AClass: class {},
    }
);

const actual = jest.requireActual<typeof import("../imported/exporting")>("");
const mock = jest.requireMock<typeof import("../imported/exporting")>("");
const genMocked = jest.doMock<typeof import("../imported/exporting")>("").genMockFromModule<typeof import("../imported/exporting")>("");
const createMocked = jest.createMockFromModule<typeof import("../imported/exporting")>("");
//@ts-ignore
jest.unstable_mockModule<typeof import("../imported/exporting")>("", () => {
    return {
        thing:{},
        AClass: class {},
    };
})

export const isMod = true;
