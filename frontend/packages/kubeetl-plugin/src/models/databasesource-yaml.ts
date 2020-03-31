import { Map as ImmutableMap } from 'immutable';
import { DatabaseSourceModel } from '.';

export const DatabaseSourceYAML = ImmutableMap().setIn(
  ['default'],
  `
apiVersion: ${DatabaseSourceModel.apiGroup}/${DatabaseSourceModel.apiVersion}
kind: ${DatabaseSourceModel.kind}
metadata:
  name: example
spec:
  account: ''
  dname: ''
  host: ''
  name: ''
  port: 0
  pwd: ''
  type: ''
`,
);
