#!/usr/bin/env node
import {Command} from 'commander'
import deployAction from './script/deploy/index.js'

const program = new Command()

program.command("deploy").description("模块发布")
    // .option("-b, --backup", "是否备份", true)
    .option("-c, --config", "配置文件", 'deployConfig.json')
    .action(deployAction)

program.parse(process.argv);
