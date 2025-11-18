# gesturetalk

# Product Vision Statement
- Shuwa is a live video conference app designed to translate sign language into summarized text during a meeting, recognizing short and simple signs through a web cam and display translated short summary captions.

# Team Members
| Name | Sprint 0 | Sprint 1 |  Sprint 2 | Sprint 3 |  Sprint 4 |
| :------- | :------: | -------: | -------: | -------: |  -------: |
| [Iva Park](https://github.com/ivapark)  | --- | Product Owner |  ---  | ---  | --- |
| [Jasmine Fan](https://github.com/jasmine7310)  | Product Owner  | ---  |  ---  | ---  | --- |
| [Terry Cao](https://github.com/cao-exe)  | Scrum Master  |   ---  | Product Owner  | --- | --- |
| [Walker Tupman](https://github.com/bestole)  | ---  | Scrum Master |  ---  | ---  | --- |
| [Venetia Liu](https://github.com/venetialiu)  | ---  | ---  | Scrum Master  | ---  | --- |

# Project History
- Shuwa came to be through the Agile Software Development & DevOps class for Fall 2025. Our team completed a project proposal to work on for the entire semester, the outcome of that being Shuwa. We also wanted to build a sign language interpreter for the sake of accessibility. A person who understands sign language and can readily translate it is not always available. So, by usingShuwa, anyone can translate sign language to text.

# How to Contribute
- [CONTRIBUTING.md](./CONTRIBUTING.md)

# How to Build and Test (Locally)
 Copy the repository onto your local computer

 Open the terminal and change into the front-end folder with the command:

``` cd front-end ```

 run npm install to install all dependencies:

``` npm install ```
 
 run npm start to run the React.js server:

``` npm start ```

Go back to project dir

``` cd .. ```

Go to back-end dir

``` cd back-end ```

 run npm install to install all dependencies:

``` npm install ```

Before running back-end, please make a .env in the back-end folder with the following and fill out the required information:
~~~
OPENROUTER_MODEL=openai/gpt-oss-20b:free
OPENROUTER_API_KEY=[api key]
MONGODB_URI=[mongoDB Atlas cluster]
PORT=5000
SERVER_URL=http://localhost:3001/
JWT_SECRET=local_testing_secret
JWT_EXPIRES_IN=7d
~~~
 
 run npm start to run the Express.js server & MongoDB

``` npm start ```

# Additional Information
- [UX-DESIGN.md](./UX-DESIGN.md)


