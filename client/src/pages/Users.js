// src/pages/Clients.jsx
import  React ,{ useState } from "react";
import UserList from "../components/User/UserList";
import UserForm from "../components/User/UserForm";

const Users = () => {
  const [refresh, setRefresh] = useState(false);

  const handleUserCreated = () => {
    setRefresh(!refresh); // on inverse pour forcer un nouveau rendu de UserList
  };

  return (
    <div>
      <h1>Utilisateurs</h1>
      <UserForm onUserCreated={handleUserCreated} />
      <UserList key={refresh.toString()} />
    </div>
  );
};

export default Users;
