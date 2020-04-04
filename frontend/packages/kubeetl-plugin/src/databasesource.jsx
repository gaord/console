import * as React from 'react';
import * as _ from 'lodash-es';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';

import { connectToFlags } from '@console/internal/reducers/features';
import { FLAGS } from '@console/internal/const';
import { DetailsPage, ListPage, Table, TableRow, TableData } from '@console/internal/components/factory';
import { Kebab, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary, Selector } from '@console/internal/components/utils';
import { ResourceEventStream } from '@console/internal/components/events';
import { DatabaseSourceModel } from './models';


const { common } = Kebab.factory;
const menuActions = [
  ...Kebab.getExtensionsActionsForKind(DatabaseSourceModel),
  ...common,
];


const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  // classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'hidden-xs'),
  // classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  // classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const DatabaseSourceTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: '', props: { className: tableColumnClasses[2] },
    },
  ]
};
DatabaseSourceTableHeader.displayName = 'DatabaseSourceTableHeader';

const kind = 'DatabaseSource';

const DatabaseSourceTableRow = ({obj, index, key, style}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};
DatabaseSourceTableRow.displayName = 'DatabaseSourceTableRow';

const Details_ = ({flags, obj: pvc}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="DatabaseSources Overview" />
      <div className="row">

      </div>
    </div>
  </React.Fragment>;
};

const Details = connectToFlags(FLAGS.CAN_LIST_PV)(Details_);


export const DatabaseSourcesList = props => <Table {...props} aria-label="DatabaseSources" Header={DatabaseSourceTableHeader} Row={DatabaseSourceTableRow} virtualize />;
export const DatabaseSourcesPage = props => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/databasesources/~new/form`,
  };
  return <ListPage {...props} ListComponent={DatabaseSourcesList} kind={kind} canCreate={true} createProps={createProps} />;
};
export const DatabaseSourcesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml(), navFactory.events(ResourceEventStream)]}
/>;
