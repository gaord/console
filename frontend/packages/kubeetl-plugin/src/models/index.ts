import { K8sKind } from "@console/internal/module/k8s";

export const DatabaseSourceModel: K8sKind = {
    apiVersion: 'v1',
    apiGroup: 'beta.sup-info.me',
    label: 'DatabaseSource',
    plural: 'databasesources',
    abbr: 'DBS',
    namespaced: true,
    kind: 'DatabaseSource',
    id: 'databasesource',
    labelPlural: 'Database Sources',
  };
  
  export const DataJobModel: K8sKind = {
    apiVersion: 'v1',
    apiGroup: 'beta.sup-info.me',
    label: 'DataJob',
    plural: 'datajobs',
    abbr: 'DJ',
    namespaced: true,
    kind: 'DataJob',
    id: 'datajob',
    labelPlural: 'Data Jobs',
  };
  