import { useNavigate } from "react-router-dom";
import LoginModal from "../../components/LoginModal";
import { useAgentAuth } from "../../context/AgentAuthContext";

export default function AgentLogin() {
  const navigate = useNavigate();
  const { login } = useAgentAuth(); // adatta al metodo esposto dal tuo context

  const handleClose = () => {
    navigate("/"); // chiusura popup -> torna alla landing
  };

  const handleSubmit = async ({ email, password }) => {
    await login(email, password);
    navigate("/agent/dashboard");
  };

  return <LoginModal onClose={handleClose} onSubmit={handleSubmit} />;
}