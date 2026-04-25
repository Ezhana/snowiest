pipeline {
  agent any

  options {
    disableConcurrentBuilds()
    timestamps()
  }

  environment {
    CI = 'true'
    COREPACK_ENABLE_DOWNLOAD_PROMPT = '0'
    DOCKER_IMAGE = 'snowiest-web'
    NX_DAEMON = 'false'
    NUXT_PUBLIC_SITE_URL = 'https://snowiest.me'
    TMPDIR = '/tmp'
  }

  stages {
    stage('Install') {
      steps {
        sh 'corepack enable'
        sh 'corepack prepare pnpm@10.33.0 --activate'
        sh 'pnpm install --frozen-lockfile'
      }
    }

    stage('Verify') {
      steps {
        sh 'pnpm nx run web:typecheck'
        sh 'pnpm nx run web:lint'
      }
    }

    stage('Build') {
      steps {
        sh 'pnpm nx run web:build'
      }
    }

    stage('Docker Image') {
      when {
        expression {
          sh(script: 'command -v docker >/dev/null 2>&1', returnStatus: true) == 0
        }
      }
      steps {
        script {
          env.IMAGE_TAG = (env.BUILD_TAG ?: 'local').replaceAll(/[^A-Za-z0-9_.-]/, '-')
        }
        sh '''
          docker build \
            --build-arg NUXT_PUBLIC_SITE_URL="${NUXT_PUBLIC_SITE_URL}" \
            -f apps/web/Dockerfile \
            -t "${DOCKER_IMAGE}:${IMAGE_TAG}" \
            -t "${DOCKER_IMAGE}:latest" \
            .
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'apps/web/.output/**', allowEmptyArchive: true
    }
  }
}
