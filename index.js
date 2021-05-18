const express = require("express");
const fs = require("fs");
const app = express();
const bodyparser = require("body-parser");
const url = require("url");
const port = 3000;

let users = JSON.parse(fs.readFileSync("./users.json", "utf-8"));
let quizes = JSON.parse(fs.readFileSync("./quizes.json", "utf-8"));

app.use(express.json());
app.use(bodyparser.json());

//PAGINA PRINCIPAL
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/main-page/main-page.html");
});
//PAGINA LOGIN
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login-page/login-page.html");
});
//PAGINA REGISTRAR
app.get("/registrar", (req, res) => {
  res.sendFile(__dirname + "/public/register-page/register-page.html");
});
//CONFIRMAR LOGIN
app.post("/login", (req, res) => {
  let found = false;
  for (let i = 0; i < users.users.length; i++) {
    if (
      users.users[i].email == req.body.email &&
      users.users[i].senha == req.body.senha
    ) {
      found = true;
      
    }
  }
  res.json({status: found ? "success" : "fail"});
  
});
//POST DE UM NOVO LOGIN
app.post("/registrar", (req, res) => {
  let data = req.body;
  let error_message = check_register(data);
  if (error_message == "success") {
    
    users.users.push({
      id: users.curr_id,
      email: data.email,
      nome: data.nome,
      senha: data.senha,
      points: 0,
    });
    users.curr_id++;
    res.status("200");
    fs.writeFile("./users.json", JSON.stringify(users), (err) => {
      if (err) error_message = "Server issues";
    });
  }
  res.body = "teste";
  res.json({
    status: error_message == "success" ? "success" : "error",
    message: error_message || null,
  });
  
});
//MAIN PAGE
app.get("/main", (req, res) => {
  res.sendFile(__dirname + "/public/final-page/final-page.html");
});
//LOADS USERS DATA AT MAIN
app.post("/main", (req, res) => {
  const email = req.body.email;
  const senha = req.body.senha;
  let nome = '';
  let placar = 0;
  let found = false;
  let q = [];
  for (let i = 0; i < users.users.length; i++) {
    if (
      users.users[i].email == email &&
      users.users[i].senha == senha
    ) {
      q = [];
      for(let i =0; i< quizes.quiz.length;i++){
        q.push({id: quizes.quiz[i].id, tema: quizes.quiz[i].tema, nome: quizes.quiz[i].nome})
      }
      found = true;
      nome = users.users[i].nome;
      placar = users.users[i].points;

    }
  }
  if(found){
    res.json({status:"success", nome: nome, placar: placar, quizes: q})
  }else{
    req.json({status: "error"})
  }
})
//PAGINA DE QUIZ
app.get("/quiz", (req, res) => {
  fs.readFile(
    "./public/play-quiz-page/play-quiz-page.html",
    "utf-8",
    (err, data) => {
      if (!err) {
        res.end(data.replace("${QUIZ-ID}", req.query.id));
      }
    }
  );
});
//CARREGAR DESEJADO QUIZ
app.get("/get-quiz/:id", (req, res) => {
  let id = req.params.id;
  let quiz;
  for (let i = 0; i < quizes.quiz.length; i++) {
    if (quizes.quiz[i].id == id) {
      quiz = quizes.quiz[i].perguntas;
    }
  }
  if (!quiz) {
    res.json({ status: "not found" });
  } else {
    let resp = { status: "success", perguntas: [] };
    for (let i = 0; i < quiz.length; i++) {
      resp.perguntas.push({
        pergunta: quiz[i].pergunta,
        a: quiz[i].a,
        b: quiz[i].b,
        c: quiz[i].c,
        d: quiz[i].d,
      });
    }
    res.json(resp);
  }
});
//VERIFICAR DESEJADA PERGUNTA
app.post("/get-quiz/:id", (req, res) => {
  
  try{
  let id = req.params.id;
  let letter = req.body.letter;
  let pergunta = req.body.pergunta;
  let status = "wrong";
  let user_email = req.body.user_email || "-1";
  let found = false;
  let r_q;
  
  
    for (let i = 0; i < quizes.quiz.length; i++) {
      if (quizes.quiz[i].id == id) {
        found = true;
        r_q = quizes.quiz[i].perguntas[pergunta].certa
        if (quizes.quiz[i].perguntas[pergunta].certa == letter) {
          status = "right";
          for (let i = 0; i < users.users.length; i++) {
            if ((users.users[i].email == user_email)) {
              users.users[i].points += 5;
              
              fs.writeFile("./users.json", JSON.stringify(users), (err) => {
                if (err) status = "server issues";
              });
            }
          }
        }
      }
    }
  
  if (found) {
    res.json({ status: status , right: r_q});
  } else {
    res.json({ status: "not found" , right: "null"});
  }
  }catch{
    res.json({ status: "not found" , right: "null"});
    console.log("crashed quiz");
  }finally{

  }
  
});
//PAGINA DE PARABENS
app.get("/resultados", (req, res) => {
  fs.readFile('./public/congrats-page/congrats-page.html', (err, data) =>{
    if(!err){
      data = data.toString();
      data = data.replace("{PONTOSGANHOS}", (parseInt(req.query.right)*5).toString()).replace("{ACERTOS}", req.query.right).replace("{ERROS}", req.query.wrong)
      res.send(data);
    }else{
      res.send("ERROR")
    }
  })
})
app.get("/success", (req, res) =>{
  res.sendFile(__dirname + "/public/success-page/success-page.html");
})
//PAGINA CRIAR QUIZ
app.get("/criarquiz", (req, res) => {
  res.sendFile(__dirname + "/public/create-quiz-page/create-quiz-page.html");
})
//POST A NEW QUIZ
app.post("/criarquiz", (req, res)=>{
  let quiz = req.body;
  let status = "success";
  if(quiz.email == "" || quiz.tema == "" || quiz.perguntas == []){
    status = "Campos vazios"
  }
  
  for(let i = 0; i<quiz.perguntas.length;i++){
    if(quiz.perguntas[i].a == "" || quiz.perguntas[i].b == "" || quiz.perguntas[i].c == "" || quiz.perguntas[i].d == "" || quiz.perguntas[i].certa == "" || quiz.perguntas[i].pergunta == ""){
      status = "Campos vazios"
    }
  }

  if(status == "success"){
    let nome = '';
    for(let i =0;i<users.users.length;i++){
      if(users.users[i].email == quiz.email){
        nome = users.users[i].nome;
        break;
      }
    }
    quizes.quiz.push({
      id: quizes.curr_id++,
      nome: nome,
      tema: quiz.tema,
      perguntas: quiz.perguntas
    })
    
    fs.writeFile("quizes.json", JSON.stringify(quizes), (err) =>{
      if (err) status = "server issues"
    })
     res.json({status: status})
  }

  
})
app.get("/serverissues", (req, res) =>{
  res.send('Server issues')
})

function check_register(data) {
  if (
    data.nome.length == 0 ||
    data.email.length == 0 ||
    data.senha.length == 0
  ) {
    return "Campo(s) inválidos";
  }
  if (data.nome.length < 4 || data.email.length == 5) {
    return "Campo(s) muito curto(s)";
  }

  if (data.email.includes(" ") || data.senha.includes(" "))
    return "Espaço inválido";

  for (let i = 0; i < users.users.length; i++) {
    if (data.email == users.users[i].email) return "Email já cadastrado";
  }

  if (data.nome.length > 40) return "Nome inválido";

  if (data.email.length > 50) return "Email inválido";

  if (data.senha.length > 30) return "Senha inválida";

  if (data.senha.length < 8) return "Senha muito fraca";
  return "success";
}

app.listen(port, () => {
  console.log("[+] UP AND RUNNING");
});
