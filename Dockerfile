FROM amazon/aws-lambda-nodejs:18

# Copy function code
COPY package.json ${LAMBDA_TASK_ROOT}/.
COPY tsconfig.json ${LAMBDA_TASK_ROOT}/.
COPY src/resize.ts ${LAMBDA_TASK_ROOT}/src/resize.ts
RUN cd ${LAMBDA_TASK_ROOT}
RUN npm install
RUN npx tsc
RUN cp dist/resize.js .

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "resize.handler" ]
