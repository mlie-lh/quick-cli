import inquirer from "inquirer";
import gulpUtil from "gulp-util";
import path from 'node:path'
import gulp from "gulp";
import fse from "fs-extra";
import sftp from "../../utils/gulp-sftp-up5.cjs"

// 扫描dist目录
function scanDirectory() {
  const scanPath = 'dist'
  const targetPath = path.join(process.cwd(), `./${scanPath}`)
  // 检查目录
  const isPath = fse.existsSync(targetPath)
  if (!isPath) {
    console.log(`未能在${process.cwd()}路径下找到${scanPath}目录,请检查！`)
    process.exit()
  }
  const isDirectory = fse.statSync(targetPath).isDirectory()
  if (!isDirectory) {
    console.log(`未能在${process.cwd()}路径下找到${scanPath}目录,请检查！`)
    process.exit()
  }
  // 扫描dist目录
  return fse.readdirSync(path.join(targetPath))
}

function configParse(configPath = 'deployConfig.json') {
  const targetPath = path.join(process.cwd(), `${configPath}`)
  // 检查目录
  const isPath = fse.existsSync(targetPath)
  if (!isPath) {
    return {}
  }
  // 读取
  const publishConfig = fse.readJsonSync(targetPath, {throws: false})
  return !!publishConfig ? publishConfig : {}
}

/**
 * @param localPath String
 * @param sftpConfig Object
 * @param sftpConfig.remotePath String
 * @param sftpConfig.host String
 * @param sftpConfig.username String
 * @param sftpConfig.password String
 * @param sftpConfig.port String
 * */
function runDeploy(localPath, sftpConfig) {
  gulpUtil.log('配置确认完成,执行Deploy')
  if (['', '/', '/*', '*'].includes(sftpConfig.remotePath)) {
    gulpUtil.log('参数不合法,请谨慎操作!')
    process.exit()
  }
  gulp.src(localPath).pipe(sftp(sftpConfig))
}

export default async (options, Command) => {
  const publishConfig = configParse()
  // const releaseList = scanDirectory()
  const questionList = [
    {
      type: 'input',
      message: '请输入要上传的目录:',
      name: 'localPath',
      default: publishConfig.localPath,
    },
    {
      type: 'input',
      message: '请输入远程服务器的目录:',
      name: 'remotePath',
      default: publishConfig.remotePath,
    },
    {
      type: 'input',
      message: '请输入远程服务器地址:',
      name: 'host',
      default: publishConfig.host
    },
    {
      type: 'input',
      message: '请输入端口号:',
      name: 'port',
      default: publishConfig.port || 22,
    },
    {
      type: 'input',
      message: '请输入用户名:',
      name: 'username',
      default: publishConfig.username
    },
    {
      type: "password", // 密码为密文输入
      message: "请输入密码：",
      name: "password",
      default: publishConfig.password
    }
  ]
  const replyBranch = await inquirer.prompt(questionList);
  const {localPath, ...sftpConfig} = replyBranch
  sftpConfig.removeCurrentFolderFiles = true
  // const time = Math.floor(new Date().getTime() / 1000)
  // const customCommand = `cp -rf ${sftpConfig.remotePath} ${sftpConfig.remotePath}_backup_${time}`
  // if (options.backup) {
  //   sftpConfig.customCommand = customCommand
  // }
  const currentLocalPath = path.join(process.cwd(), `${localPath.startsWith('/') ? '' : `/`}${localPath}`) + "/**";
  gulpUtil.log('发布目录:', localPath)
  gulpUtil.log('sftp配置:', {...sftpConfig, password: '******'})
  runDeploy(currentLocalPath, sftpConfig)
}
