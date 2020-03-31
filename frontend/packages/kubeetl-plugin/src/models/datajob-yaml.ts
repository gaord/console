import { Map as ImmutableMap } from 'immutable';
import { DataJobModel } from '.';

export const DataJobYAML = ImmutableMap().setIn(
  ['default'],
  `
apiVersion: ${DataJobModel.apiGroup}/${DataJobModel.apiVersion}
kind: ${DataJobModel.kind}
metadata:
  name: example
spec:
  cmname: ''
`,
);
