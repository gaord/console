import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ActionGroup, Button } from '@patternfly/react-core';
import { k8sCreate, K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import {
  ButtonBar,
  history,
  resourceObjPath,
} from '@console/internal/components/utils';
import { DatabaseSourceModel } from './models/index';

export const CreateDBS = (props) => {
  return <CreateDBSPage namespace={props.match.params.ns} />;
};

class CreateDBSPage extends React.Component<CreateDBSPageProps, CreateDBSPageState> {
  state = {
    error: '',
    inProgress: false,
    title: 'Create DatabaseSource',
    dbsObj: null,
  };

  onChange = (dbsObj: K8sResourceKind) => {
    this.setState({ dbsObj });
  };

  save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    this.setState({ inProgress: true });
    k8sCreate(DatabaseSourceModel, this.state.dbsObj).then(
      resource => {
        this.setState({ inProgress: false });
        history.push(resourceObjPath(resource, referenceFor(resource)));
      },
      err => this.setState({ error: err.message, inProgress: false })
    );
  };

  render() {
    const { title, error, inProgress } = this.state;
    const { namespace } = this.props;
    return (
      <div className="co-m-pane__body co-m-pane__form">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">
            {title}
          </div>
          <div className="co-m-pane__heading-link">
            <Link to={`/k8s/ns/${namespace}/databasesources/~new`} id="yaml-link" replace>Edit YAML</Link>
          </div>
        </h1>
        <form className="co-m-pane__body-group" onSubmit={this.save}>
          <CreateDBSForm onChange={this.onChange} namespace={namespace} />
          <ButtonBar errorMessage={error} inProgress={inProgress}>
            <ActionGroup className="pf-c-form">
              <Button
                id="save-changes"
                type="submit"
                variant="primary">
                Create
              </Button>
              <Button
                onClick={history.goBack}
                type="button"
                variant="secondary">
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    );
  }
}

export class CreateDBSForm extends React.Component<CreateDBSFormProps, CreateDBSFormState> {
  state = {
    dbAccount: '',
    dbName: '',
    dbHost: '',
    name: '',
    port: '',
    dbType: '',
    passwd: '',
  };

  handleChange: React.ReactEventHandler<HTMLInputElement> = event => {
    const { name, value } = event.currentTarget;
    this.setState({ [name]: value } as any, this.onChange);
  };

  onChange = () => {
    return this.props.onChange(this.updateDBS());
  }

  updateDBS = () => {
    const { namespace } = this.props;
    const { dbAccount, dbName, dbHost, dbType, passwd, port, name  } = this.state;
    const obj: K8sResourceKind = {
      apiVersion: 'beta.sup-info.me/v1',
      kind: 'DatabaseSource',
      metadata: {
        name,
        namespace,
      },
      spec: {
        account: dbAccount,
        dname: dbName,
        host: dbHost,
        name: name,
        port: Number.parseInt(port),
        pwd: passwd,
        type: dbType,
      }
    };
    return obj;
  };

  render() {
    return (
      <div>
        <label className="control-label co-required" htmlFor="dbs-name">
          数据源名称
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my-dbs-name"
            aria-describedby="dbs-name-help"
            id="dbs-name"
            name="name"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="dbs-name-help">
            数据源名称.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="db-type">
        数据库类型
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my-db-type"
            aria-describedby="db-type-help"
            id="db-type"
            name="dbType"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="db-type-help">
            数据库类型
          </p>
        </div>

        <label className="control-label co-required" htmlFor="db-host">
        数据库主机
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my-db-host-name"
            aria-describedby="db-host-help"
            id="db-host"
            name="dbHost"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="db-host-help">
            数据库主机地址
          </p>
        </div>

        <label className="control-label co-required" htmlFor="port">
        数据库主机端口
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my-db-port"
            aria-describedby="port-help"
            id="port"
            name="port"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="port-help">
          数据库主机端口.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="db-name">
        数据库名称
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my-db-name"
            aria-describedby="db-name-help"
            id="db-name"
            name="dbName"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="db-name-help">
          数据库名称.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="db-account">
        数据库账户
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my-db-account-name"
            aria-describedby="db-account-help"
            id="db-account"
            name="dbAccount"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="db-account-help">
          数据库账户.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="passwd">
          数据库密码
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my-db-password"
            aria-describedby="passwd-help"
            id="passwd"
            name="passwd"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="passwd-help">
          数据库密码
          </p>
        </div>
      </div>
    );
  }
}

export type CreateDBSFormProps = {
  namespace: string;
  onChange: Function;
};

export type CreateDBSFormState = {
  dbAccount: string;
  dbName: string;
  dbHost: string;
  name: string;
  port: string;
  passwd: string;
  dbType: string;
};

export type CreateDBSPageProps = {
  namespace: string;
};

export type CreateDBSPageState = {
  inProgress: boolean;
  error: string;
  title: string;
  dbsObj: K8sResourceKind;
};