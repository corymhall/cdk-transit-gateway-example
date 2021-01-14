const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.84.0',
  name: 'cdk-sandbox-networking',
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ram',
    '@aws-cdk/aws-ssm',
  ],
  devDeps: [
    'cdk-assume-role-credential-plugin',
  ],
  releaseWorkflow: false,
  buildWorkflow: false,
});

project.cdkConfig.plugin = ['cdk-assume-role-credential-plugin'];
project.synth();
