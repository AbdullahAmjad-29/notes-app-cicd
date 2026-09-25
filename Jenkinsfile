pipeline {
    agent any

    environment {
        DOCKERHUB_USER = 'abdullahamjad2129'
        BACKEND_IMAGE  = "${DOCKERHUB_USER}/notes-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USER}/notes-frontend"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    docker build -t notes-backend:build-${BUILD_NUMBER} ./backend
                    docker build -t notes-frontend:build-${BUILD_NUMBER} ./frontend
                '''
            }
        }

        stage('Tag Images') {
            steps {
                sh '''
                    docker tag notes-backend:build-${BUILD_NUMBER} ${BACKEND_IMAGE}:${BUILD_NUMBER}
                    docker tag notes-backend:build-${BUILD_NUMBER} ${BACKEND_IMAGE}:latest

                    docker tag notes-frontend:build-${BUILD_NUMBER} ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                    docker tag notes-frontend:build-${BUILD_NUMBER} ${FRONTEND_IMAGE}:latest
                '''
            }
        }

        stage('Scan Images') {
            steps {
                sh '''
                    trivy image --severity HIGH,CRITICAL --exit-code 1 ${BACKEND_IMAGE}:${BUILD_NUMBER}
                    trivy image --severity HIGH,CRITICAL --exit-code 1 ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                '''
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKERHUB_USERNAME',
                    passwordVariable: 'DOCKERHUB_PASSWORD'
                )]) {
                    sh '''
                        echo "$DOCKERHUB_PASSWORD" | docker login \
                            -u "$DOCKERHUB_USERNAME" \
                            --password-stdin

                        docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${BACKEND_IMAGE}:latest

                        docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${FRONTEND_IMAGE}:latest

                        docker logout
                    '''
                }
            }
        }
    }
}
