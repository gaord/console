import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ActionGroup, Button } from '@patternfly/react-core';
import { k8sCreate, K8sResourceKind, referenceFor } from '../module/k8s';
import {
//  AsyncComponent,
  ButtonBar,
  history,
  resourceObjPath,
} from './utils';
import { DataJobModel } from '../models/index';

export const CreateDJ = ({ match: { params } }) => {
  return <CreateDJPage namespace={params.ns} />;
};

class CreateDJPage extends React.Component<CreateDJPageProps, CreateDJPageState> {
  state = {
    error: '',
    inProgress: false,
    title: 'Create DataJob',
    djObj: null,
  };

  onChange = (djObj: K8sResourceKind) => {
    this.setState({ djObj });
  };

  save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    this.setState({ inProgress: true });
    k8sCreate(DataJobModel, this.state.djObj).then(
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
          <CreateDJForm onChange={this.onChange} namespace={namespace} />
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

export class CreateDJForm extends React.Component<CreateDJFormProps, CreateDJFormState> {
  state = {
    configmapName: '',
  };

  handleChange: React.ReactEventHandler<HTMLInputElement> = event => {
    const { name, value } = event.currentTarget;
    this.setState({ [name]: value } as any, this.onChange);
  };

  onChange = () => {
    return this.props.onChange(this.updateDJ());
  }

  updateDJ = () => {
    const { namespace } = this.props;
    const { configmapName } = this.state;
    const obj: K8sResourceKind = {
      apiVersion: 'beta.sup-info.me/v1',
      kind: 'DataJob',
      metadata: {
        name: configmapName,
        namespace,
      },
      spec: {
        cmname: configmapName,
      }
    };
    return obj;
  };

  render() {
    const { configmapName } = this.state;

    return (
      <div>
        <label className="control-label co-required" htmlFor="configmap-name">
          CM名称
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my-configmap-name"
            aria-describedby="configmap-name-help"
            id="configmap-name"
            name="configmapName"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="configmap-name-help">
            CM名称.
          </p>
        </div>


      </div>
    );
  }
}

export type CreateDJFormProps = {
  namespace: string;
  onChange: Function;
};

export type CreateDJFormState = {
  configmapName: string;
};

export type CreateDJPageProps = {
  namespace: string;
};

export type CreateDJPageState = {
  inProgress: boolean;
  error: string;
  title: string;
  djObj: K8sResourceKind;
};