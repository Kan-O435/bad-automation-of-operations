require "test_helper"

class AdminsControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get admins_create_url
    assert_response :success
  end
end
