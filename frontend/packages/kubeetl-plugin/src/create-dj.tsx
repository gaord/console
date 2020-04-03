import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ActionGroup, Button } from '@patternfly/react-core';
import { k8sCreate, K8sResourceKind, referenceFor, k8sGet } from '@console/internal/module/k8s';
import {
  ButtonBar,
  history,
  resourceObjPath,
  ListDropdown
} from '@console/internal/components/utils';
import { DataJobModel,DatabaseSourceModel } from './models/index';
import  { ConfigMapModel }  from '@console/internal/models/index';
import { namespace } from 'd3';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import update from 'immutability-helper';

export const CreateDJ = (props) => {
  return <CreateDJPage namespace={props.match.params.ns} />;
};
class CreateDJPage extends React.Component<CreateDJPageProps, CreateDJPageState> {
  state = {
    error: '',
    inProgress: false,
    title: 'Create DataJob',
    djObj: null,
    cmObj: null,
  };

  onChange = (obj:{djObj: K8sResourceKind, cmObj: K8sResourceKind}) => {
    this.setState(obj);
  };

  save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    this.setState({ inProgress: true });
    k8sCreate(DataJobModel, this.state.djObj).then(
      resource => {
        history.push(resourceObjPath(resource, referenceFor(resource)));
      },
      err => this.setState({ error: err.message, inProgress: false })
    );

    k8sCreate(ConfigMapModel, this.state.cmObj).then(
      resource => {
        history.push(resourceObjPath(resource, referenceFor(resource)));
      },
      err => this.setState({ error: err.message, inProgress: false })
    );
    this.setState({ inProgress: false });
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
            <Link to={`/k8s/ns/${namespace}/datajobs/~new`} id="yaml-link" replace>Edit YAML</Link>
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

let defaulJob = {
    setting: {
      speed: {
        channel: 1
      },
      errorLimit: {
        record: 1,
        percentage: 1
      },
    },
    content: {
      reader: {
        name: '',
        parameter: {
          username: '',
          password: '',
          column: [''],
          splitPk: '',
          where: '',
          querySql: '',
          fetchSize: 1024,
          session: [''],
          connection: [
            {              
              table: [''],
              jdbcUrl: [''],
            },
          ],
        },
      },
      writer: {
        name: '',
        parameter: {
          username: '',
          password: '',
          column: [''],
          preSql: '',
          postSql: '',
          batchSize: 1024,
          session: [''],
          writeMode: '',
          connection: [
            {              
              table: [''],
              jdbcUrl: [''],
            },
          ],
        }
      },
    },
};

export class CreateDJForm extends React.Component<CreateDJFormProps, CreateDJFormState> {
  state = {
    configmapName: '',
    job: defaulJob,
    srcDbs: {},
    dstDbs: {},
  };

  getLiteralObjectFromDotPath(dotPath: string, value: string): string
  {
    let leftItem:string[] = _.split(dotPath,'.');
    let out: string = '';
    _.forEach<string>(leftItem,item => out += '{\"'+item+'\":');
    
    //为了完成对象属性的深度拷贝，准备immutability-helper中需要的set命令
    out +='{\"$set\":\"'+ value +'\"}'+_.repeat('}',leftItem.length);
    return out;
  };
  
  handleChange: React.ReactEventHandler<HTMLInputElement> = event => {
    const { name, value } = event.currentTarget;
    let literalObj = this.getLiteralObjectFromDotPath(name,value);
    
    //为了增量更新state.job中的特定属性
    let tempJob = this.state.job;
    let finalJob = update(tempJob,JSON.parse(literalObj).job);
    this.setState( {job:{...finalJob}} as any, this.onChange);
  };

  onChange = () => {
    return this.props.onChange(this.updateDJ());
  }

  handleSrcDbs = (name: string ) => {
    k8sGet(DatabaseSourceModel,name,this.props.namespace).then((obj) => {
      this.setState({srcDbs: obj});    
    },(error) => {
      console.error(error.message);
    })
  };

  handleDstDbs = (name: string ) => {
    k8sGet(DatabaseSourceModel,name,this.props.namespace).then((obj) => {
      this.setState({dstDbs: obj});    
    },(error) => {
      console.error(error.message);
    })
  };

  updateDJ = () => {
    const { namespace } = this.props;
    const { configmapName } = this.state;
    const djObj: K8sResourceKind = {
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
    const cmObj: K8sResourceKind = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: configmapName,
        namespace,
      },
      data: {
        'config.json': `|
        {
        ${JSON.stringify(this.state.job)}
        }`     
      },
    };
    return {djObj,cmObj};
  };

  render() {
    const { configmapName } = this.state;

    return (
      <div>
        <label className="control-label co-required" htmlFor="configmap-name">
          ConfigMap名称
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
          作业配置将创建为指定名称的ConfigMap.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="channels">
          通道数量
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="2"
            aria-describedby="channels-help"
            id="channels"
            name="job.setting.speed.channel"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="channels-help">
          通道数量是关于数据传输速度的设置.
          </p>
        </div>

        <FormSection title="读取设置">
        <label className="control-label co-required" htmlFor="src-dbs-dropdown">
          读取数据源
        </label>
        <div className="form-group">
          <ListDropdown
            resources={[{kind: "DatabaseSource", namespace: namespace}]}
            desc={"数据来源"}
            placeholder={`Select DatabaseSource`}
            onChange = {this.handleSrcDbs}
            id="src-dbs-dropdown"
            name="srcDbs"
          />
          <p className="help-block" id="src-dbs-dropdown-help">
          从列表中选择数据读取来源.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="tables">
          表名
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="mytables"
            aria-describedby="tables-help"
            id="tables"
            name="job.content.reader.parameter.connection.table"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="tables-help">
          读取的一个或者多个表名称列表.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="columns">
          列名
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="mycolumns"
            aria-describedby="columns-help"
            id="columns"
            name="job.content.reader.parameter.column"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="columns-help">
          读取的一个或者多个表中列名称列表.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="querysql">
          sql查询
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my query sql"
            aria-describedby="querysql-help"
            id="querysql"
            name="job.content.reader.parameter.querySql"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="querysql-help">
          使用sql语句定义读取规则.
          </p>
        </div>
        </FormSection>

        <FormSection title="写入设置">
        <label className="control-label co-required" htmlFor="dst-dbs-dropdown">
        写入数据源
        </label>
        <div className="form-group">
          <ListDropdown
            resources={[{kind: "DatabaseSource", namespace: namespace}]}
            desc={"数据去向"}
            placeholder={`Select DatabaseSource`}
            onChange = {this.handleDstDbs}
            id="dst-dbs-dropdown"
            name="dstDbs"
          />
          <p className="help-block" id="dst-dbs-dropdown-help">
          从列表中选择数据写入目标.
          </p>
        </div>
        </FormSection>
      </div>
    );
  }
};

type connection = {
  table: string[];
  jdbcUrl: string[];
};
type Job = {
  setting: {
    speed: {
      channel: number;
    };
    errorLimit: {
      record: number;
      percentage: number;
    };
  };
  content: {
    reader: {
      name: string;
      parameter: {
        username: string;
        password: string;
        column: string[];
        splitPk: string;
        where: string;
        querySql: string;
        fetchSize: number;
        session: string[];
        connection: connection[];
      };
    };
    writer: {
      name: string;
      parameter: {
        username: string;
        password: string;
        column: string[];
        preSql: string;
        postSql: string;
        batchSize: number;
        session: string[];
        writeMode: string
        connection: connection[];
      }
    };
  };
};

export type CreateDJFormProps = {
  namespace: string;
  onChange: Function;
};
export type CreateDJFormState = {
  configmapName: string;
  job: Job;
  srcDbs: K8sResourceKind;
  dstDbs: K8sResourceKind;
};

export type CreateDJPageProps = {
  namespace: string;
};

export type CreateDJPageState = {
  inProgress: boolean;
  error: string;
  title: string;
  djObj: K8sResourceKind;
  cmObj: K8sResourceKind;
};