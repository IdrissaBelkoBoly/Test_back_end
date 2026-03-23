// src/components/Client/ClientList.jsx
import { useEffect, useState } from "react";
import { getAllUsers } from "../../services/UserService";

const UserList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        console.error("Erreur lors du chargement des Utilisateurs", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Liste des utilisateurs</h2>
      {users.length === 0 ? (
        <p>Aucun utilisateur trouvé.</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user._id}>
              <strong>{user.nom}</strong> – {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;
