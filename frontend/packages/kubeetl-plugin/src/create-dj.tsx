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

export class CreateDJForm extends React.Component<CreateDJFormProps, CreateDJFormState> {
  state = {
    configmapName: null,
    job: defaulJob,
    // srcDbs: null,
    // dstDbs: null,
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

  setJobState( newJob: Job ){
    //为了增量更新state.job中的特定属性
    let tempJob = this.state.job;
    let finalJob = update(tempJob, newJob as any);
    this.setState( {job:{...finalJob}} as any, this.onChange);    
  }
  
  handleChange: React.ReactEventHandler<HTMLInputElement> = event => {
    const { name, value } = event.currentTarget;
    if(name.indexOf(".") > 0)
    {
      let literalObj = this.getLiteralObjectFromDotPath(name,value);
      this.setJobState(JSON.parse(literalObj).job);  
    }
    else{
      this.setState({ [name]: value } as any, this.onChange);
    }
    };

  onChange = () => {
    return this.props.onChange(this.updateDJ());
  }
  
  getJobFromDBS(dbsObj: K8sResourceKind, isSource: boolean): any
  {
    let spec = (dbsObj as K8sResourceKind).spec;
    let jdbcUrl = 'jdbc:' + spec.type + '://' + spec.host + ':' + spec.port + '/' + spec.dname;
    if(isSource)
    {
      return {
        content: {
          reader: {
            name: {$set: spec.type + 'reader'},
            parameter: {
              username: {$set: spec.account},
              password: {$set: spec.pwd},
              connection: [
                {              
                  jdbcUrl: {$set: [jdbcUrl]},
                },
              ],
            },
          },
        },    
      };
    }
    else
    {
      return {
        content: {
          writer: {
            name: {$set: spec.type + 'writer'},
            parameter: {
              username: {$set: spec.account},
              password: {$set: spec.pwd},
              connection: [
                {              
                  jdbcUrl: {$set: [jdbcUrl]},
                },
              ],
            }
          },
        },    
      };  
    }
  };

  handleSrcDbs = (name: string ) => {
    k8sGet(DatabaseSourceModel,name,this.props.namespace).then((obj) => {
      //this.setState({srcDbs: obj});
      this.setJobState(this.getJobFromDBS(obj, true));
    },(error) => {
      console.error(error.message);
    })
  };

  handleDstDbs = (name: string ) => {
    k8sGet(DatabaseSourceModel,name,this.props.namespace).then((obj) => {
      //this.setState({dstDbs: obj});
      this.setJobState(this.getJobFromDBS(obj, false));    
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
    return (
      <React.Fragment>
        <FormSection title="通用设置">
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
        </FormSection>
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

        <label className="control-label co-required" htmlFor="src-tables">
          表名
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my src tables"
            aria-describedby="src-tables-help"
            id="src-tables"
            name="job.content.reader.parameter.connection.table"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="src-tables-help">
          读取的一个或者多个表名称列表.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="src-columns">
          列名
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my src columns"
            aria-describedby="src-columns-help"
            id="src-columns"
            name="job.content.reader.parameter.column"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="src-columns-help">
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

        <label className="control-label co-required" htmlFor="presql">
          写入前Sql
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my presql"
            aria-describedby="presql-help"
            id="presql"
            name="job.content.writer.parameter.preSql"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="presql-help">
          数据作业前需要执行的sql语句.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="postsql">
          写入后Sql
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my postsql"
            aria-describedby="postsql-help"
            id="postsql"
            name="job.content.writer.parameter.postSql"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="postsql-help">
          数据作业后需要执行的sql语句.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="dst-tables">
          表名
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my dst tables"
            aria-describedby="dst-tables-help"
            id="dst-tables"
            name="job.content.writer.parameter.connection.table"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="dst-tables-help">
          写入的一个或者多个表名称列表.
          </p>
        </div>

        <label className="control-label co-required" htmlFor="dst-columns">
          列名
        </label>
        <div className="form-group">
          <input
            className="pf-c-form-control"
            type="text"
            onChange={this.handleChange}
            placeholder="my dst columns"
            aria-describedby="dst-columns-help"
            id="dst-columns"
            name="job.content.writer.parameter.column"
            pattern="[a-z0-9](?:[-a-z0-9]*[a-z0-9])?"
            required
          />
          <p className="help-block" id="dst-columns-help">
          写入的一个或者多个表中列名称列表.
          </p>
        </div>
        </FormSection>
      </React.Fragment>
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
      byte: number;
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

let defaulJob: Job = {
  setting: {
    speed: {
      channel: 1,
      byte: 10240
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

export type CreateDJFormProps = {
  namespace: string;
  onChange: Function;
};
export type CreateDJFormState = {
  configmapName: string;
  job: Job;
  // srcDbs: K8sResourceKind;
  // dstDbs: K8sResourceKind;
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