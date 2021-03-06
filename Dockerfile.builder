# Used for compiling the tectonic-console. After editing this file,
# (and committing your edits) you should run ./push-builder.sh to
# push a new version of your image to quay.io/coreos/tectonic-console-builder

FROM golang:1.11-stretch

MAINTAINER Ed Rooth - CoreOS

### For golang testing stuff
RUN go get -u github.com/golang/lint/golint
RUN go get github.com/jstemmer/go-junit-report

### Install NodeJS and yarn
ENV NODE_VERSION="v10.17.0"
ENV YARN_VERSION="v1.7.0"

# yarn needs a home writable by any user running the container
ENV HOME /opt/home
RUN mkdir -p ${HOME}
RUN chmod 777 -R ${HOME}

RUN apt-get update \
    && apt-get install --no-install-recommends -y -q \
    curl wget git unzip bzip2 jq

RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.17.0/bin/linux/amd64/kubectl && \
    chmod +x ./kubectl && \
    mv ./kubectl /usr/local/bin/kubectl

RUN cd /tmp && \
    wget --quiet -O /tmp/node.tar.gz http://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz && \
    tar xf node.tar.gz && \
    rm -f /tmp/node.tar.gz && \
    cd node-* && \
    cp -r lib/node_modules /usr/local/lib/node_modules && \
    cp bin/node /usr/local/bin && \
    ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
# so any container user can install global node modules if needed
RUN chmod 777 /usr/local/lib/node_modules
# cleanup
RUN rm -rf /tmp/node-v*

RUN cd /tmp && \
    wget --quiet -O /tmp/yarn.tar.gz https://github.com/yarnpkg/yarn/releases/download/${YARN_VERSION}/yarn-${YARN_VERSION}.tar.gz && \
    tar xf yarn.tar.gz && \
    rm -f /tmp/yarn.tar.gz && \
    mv /tmp/yarn-${YARN_VERSION} /usr/local/yarn && \
    ln -s /usr/local/yarn/bin/yarn /usr/local/bin/yarn

# Install Chrome for installer gui tests
RUN wget --quiet -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' && \
    apt-get update && \
    apt-get install --no-install-recommends -y -q \
    google-chrome-stable ca-certificates
