import { toThrowTsErrorMatcher } from "./toThrowTsErrorMatcher";

const expectExtendMap = {
  "toThrowTsError": toThrowTsErrorMatcher,
} satisfies jest.ExpectExtendMap;
expect.extend(expectExtendMap);
const extendedExpect = expect as jest.ExtendedExpect<typeof expectExtendMap>;
export default extendedExpect;