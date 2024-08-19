import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  useGetCsrfTokenQuery,
  useLazyGetWsRefreshTokenQuery,
} from "../../Redux/rtkquery/auth";
import { setCsrfToken, setWsRefreshToken } from "../../Redux/slices/authSlice";
import WealthsimpleAuthModal from "../Modals/WealthsimpleAuthModal";

const AuthWrapper = ({ children }) => {
  const dispatch = useDispatch();
  const csrfToken = useSelector((state) => state.auth.csrfToken);
  const wsRefreshToken = useSelector((state) => state.auth.wsRefreshToken);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [twoFaError, setTwoFaError] = useState(null);

  const {
    data: csrfTokenData,
    isLoading: isCsrfLoading,
    error: csrfError,
  } = useGetCsrfTokenQuery();

  const [
    fetchRefreshToken,
    { isLoading: isRefreshLoading, error: refreshError },
  ] = useLazyGetWsRefreshTokenQuery();

  useEffect(() => {
    const fetchTokens = async () => {
      if (csrfTokenData && !csrfToken) {
        const csrfToken = csrfTokenData.csrf_token;
        dispatch(setCsrfToken(csrfToken));
        if (!wsRefreshToken) setIsModalOpen(true);
      }
    };

    if (csrfTokenData && !csrfToken) {
      fetchTokens();
    }
  }, [csrfTokenData, csrfToken, wsRefreshToken, fetchRefreshToken, dispatch]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTwoFaError(null); // Reset the error state when the modal closes
  };

  const handleTwoFaSubmit = async (twoFaCode) => {
    if (csrfToken) {
      try {
        const result = await fetchRefreshToken({
          csrfToken,
          twoFaCode,
        }).unwrap();
        const wsRefreshToken = result.ws_refresh_token;
        dispatch(setWsRefreshToken(wsRefreshToken));
        setIsModalOpen(false);
        setTwoFaError(null); // Reset any previous errors
      } catch (error) {
        console.log("Failed to Fetch Refresh Token");
        console.log(error);
        setTwoFaError(error.error_message);
      }
    }
  };

  if (csrfError || refreshError) {
    console.error("Error fetching tokens:", csrfError || refreshError);
  }

  return (
    <>
      <WealthsimpleAuthModal
        open={isModalOpen}
        handleClose={handleModalClose}
        handleSubmit={handleTwoFaSubmit}
        errorMessage={twoFaError} // Pass the error message to the modal
      />
      {csrfToken && wsRefreshToken ? children : <div></div>}
    </>
  );
};

export default AuthWrapper;
