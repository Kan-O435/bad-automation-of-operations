class Admin < ApplicationRecord
  has_secure_password
  has_many :tournaments, dependent: :destroy

  validates :email, presence: true, uniqueness: true

  validates :password, length: { minimum: 8 }
end
