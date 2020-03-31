import * as _ from 'lodash';
import {
  Plugin,
  ResourceNSNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  ModelFeatureFlag,
  YAMLTemplate,
  ModelDefinition,
  RoutePage,
} from '@console/plugin-sdk';
import * as models from './models';
import { DatabaseSourceYAML } from './models/databasesource-yaml';
import { DataJobYAML } from './models/datajob-yaml';

type ConsumedExtensions =
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | ModelFeatureFlag
  | YAMLTemplate
  | ModelDefinition
  | RoutePage;

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Workloads',
      perspective: 'admin',
      componentProps: {
        name: 'Database Sources',
        resource: 'databasesources',
        testID: 'advanced-databasesource-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Workloads',
      perspective: 'admin',
      componentProps: {
        name: 'Data Jobs',
        resource: 'datajobs',
        testID: 'advanced-datajob-header',
      },
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.DatabaseSourceModel,
      loader: () =>
        import('./databasesource' /* webpackChunkName: "databasesource" */).then(
          (m) => m.DatabaseSourcesPage,
        ),
    },
  },  
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.DatabaseSourceModel,
      loader: () =>
        import('./databasesource' /* webpackChunkName: "databasesource" */).then(
          (m) => m.DatabaseSourcesDetailsPage,
        ),
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: models.DataJobModel,
      loader: () =>
        import('./datajob' /* webpackChunkName: "datajob" */).then(
          (m) => m.DataJobsPage,
        ),
    },
  },  
  {
    type: 'Page/Resource/Details',
    properties: {
      model: models.DataJobModel,
      loader: () =>
        import('./datajob' /* webpackChunkName: "datajob" */).then(
          (m) => m.DataJobsDetailsPage,
        ),
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.DatabaseSourceModel,
      template: DatabaseSourceYAML.getIn(['default']),
    },
  },
  {
    type: 'YAMLTemplate',
    properties: {
      model: models.DataJobModel,
      template: DataJobYAML.getIn(['default']),
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/k8s/ns/:ns/databasesources/~new/form'],
      loader: () =>
        import(
          './create-dbs' /* webpackChunkName: "create-dbs" */
        ).then(m => m.CreateDBS),
    },
  },  
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: `/k8s/ns/:ns/datajobs/~new/form`,
      loader: () =>
         import('./create-dj' /* webpackChunkName: "create-dj" */)
          .then(m => m.CreateDJ),
    },
  },
];

export default plugin;
