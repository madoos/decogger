# HOW TO DEPLOY YOUR ARTIFACT

## First you have to replace a lot of varibles in your project, by example

## Deploy artifact locally
* First write in your artifact workspace the next command.
    ```sh
     > npm link
    ````
* After that in your project just install your module.
    ```sh
    > npm install --save-dev your-module-name
    ```
* This options allows to you to deploy your module on the fly.
## Jenkins
* Open a ticket in [Devops](https://jira.universia.net/plugins/servlet/desk/portal/8) and request for the pipelines to your artifact.

## How to publish

* You should have your pipelines
* In your package.json set name: 1.0.0-rc or 1.0.0
* Make a merge request and merge your branch to develop
* Then go to your pipeline, rc-{your project} or release-{your project} and publish your module.
    